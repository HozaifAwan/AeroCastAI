import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from config import settings


@contextmanager
def database(path=None):
    database_path = path or settings.database_path
    connection = sqlite3.connect(database_path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _add_missing_columns(connection, table: str, columns: dict[str, str]) -> None:
    existing = {row["name"] for row in connection.execute(f'PRAGMA table_info("{table}")')}
    for name, declaration in columns.items():
        if name not in existing:
            connection.execute(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {declaration}')


def initialize_database(path=None) -> None:
    database_path = path or settings.database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with database(database_path) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zipcode TEXT NOT NULL,
                lat REAL,
                lon REAL,
                email TEXT NOT NULL,
                subscribed_at TEXT NOT NULL
            )
        """)
        _add_missing_columns(connection, "users", {
            "lat": "REAL", "lon": "REAL", "email": "TEXT", "subscribed_at": "TEXT"
        })
        # Preserve the oldest record if a legacy database already has duplicates.
        connection.execute("""
            DELETE FROM users
            WHERE id NOT IN (
                SELECT MIN(id) FROM users GROUP BY lower(email), zipcode
            )
        """)
        connection.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_zipcode_unique "
            "ON users(lower(email), zipcode)"
        )
        connection.execute("""
            CREATE TABLE IF NOT EXISTS prediction_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                location_name TEXT,
                prediction INTEGER NOT NULL,
                risk_probability REAL NOT NULL,
                weather_json TEXT NOT NULL,
                drivers_json TEXT NOT NULL
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS alert_deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                sent_at TEXT NOT NULL,
                risk_probability REAL NOT NULL,
                status TEXT NOT NULL,
                provider_message TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS monitoring_cycles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                dry_run INTEGER NOT NULL,
                status TEXT NOT NULL,
                subscriptions_checked INTEGER NOT NULL DEFAULT 0,
                predictions_evaluated INTEGER NOT NULL DEFAULT 0,
                emails_sent INTEGER NOT NULL DEFAULT 0,
                events_skipped INTEGER NOT NULL DEFAULT 0,
                failures INTEGER NOT NULL DEFAULT 0
            )
        """)
        connection.execute("""
            CREATE TABLE IF NOT EXISTS sentinel_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cycle_id INTEGER NOT NULL,
                user_id INTEGER,
                created_at TEXT NOT NULL,
                location_key TEXT,
                event_type TEXT NOT NULL,
                alert_state TEXT NOT NULL,
                decision TEXT NOT NULL,
                risk_probability REAL,
                nws_alert_id TEXT,
                detail TEXT,
                FOREIGN KEY(cycle_id) REFERENCES monitoring_cycles(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        connection.execute("CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lon)")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_prediction_time ON prediction_logs(timestamp)")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_alert_user_time ON alert_deliveries(user_id, sent_at)")
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_sentinel_dedup "
            "ON sentinel_events(user_id, location_key, alert_state, created_at)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_cycles_started ON monitoring_cycles(started_at)"
        )


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def upsert_subscription(
    zipcode: str,
    email: str,
    latitude: float,
    longitude: float,
    path=None,
) -> tuple[int, bool]:
    with database(path) as connection:
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO users (zipcode, lat, lon, email, subscribed_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (zipcode, latitude, longitude, email.lower(), utc_now_iso()),
        )
        created = cursor.rowcount == 1
        row = connection.execute(
            "SELECT id FROM users WHERE lower(email) = ? AND zipcode = ?",
            (email.lower(), zipcode),
        ).fetchone()
        if not created:
            connection.execute(
                "UPDATE users SET lat = ?, lon = ? WHERE id = ?",
                (latitude, longitude, row["id"]),
            )
        return int(row["id"]), created


def log_prediction(
    timestamp: str,
    latitude: float,
    longitude: float,
    location_name: str,
    result: dict,
) -> None:
    with database() as connection:
        connection.execute("""
            INSERT INTO prediction_logs (
                timestamp, latitude, longitude, location_name, prediction,
                risk_probability, weather_json, drivers_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            timestamp, latitude, longitude, location_name, result["prediction"],
            result["risk_probability"], json.dumps(result["weather"]),
            json.dumps(result["drivers"]),
        ))
