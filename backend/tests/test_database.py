import sqlite3

from database import initialize_database


def test_database_initialization_is_idempotent_and_complete(tmp_path):
    path = tmp_path / "database.db"
    initialize_database(path)
    initialize_database(path)
    with sqlite3.connect(path) as connection:
        tables = {
            row[0] for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
    assert {
        "users", "prediction_logs", "alert_deliveries",
        "monitoring_cycles", "sentinel_events",
    }.issubset(tables)
