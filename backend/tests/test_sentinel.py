import sqlite3
from datetime import datetime, timedelta, timezone

from database import initialize_database, upsert_subscription
from sentinel import monitor_once


def add_user(path):
    initialize_database(path)
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            INSERT INTO users (zipcode, lat, lon, email, subscribed_at)
            VALUES ('77002', 29.7604, -95.3698, 'person@example.com', ?)
            """,
            (datetime.now(timezone.utc).isoformat(),),
        )


def high_risk(latitude, longitude):
    return {
        "prediction": 1, "risk_probability": 85.0,
        "weather": {
            "temperature_2m": 30, "relative_humidity_2m": 80,
            "wind_speed_10m": 35, "surface_pressure": 995,
        },
    }


def test_dry_run_never_sends_email_and_logs_cycle(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)

    def forbidden_email(*args):
        raise AssertionError("Dry-run attempted to send email")

    result = monitor_once(
        db_path=path, dry_run=True, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [],
        email_sender=forbidden_email,
    )
    assert result["dry_run"] is True
    assert result["dry_run_alerts"] == 1
    assert result["sent"] == 0
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT status FROM monitoring_cycles").fetchone()[0] == "completed"
        decisions = {row[0] for row in connection.execute("SELECT decision FROM sentinel_events")}
    assert {"dry_run", "no_active_alerts"}.issubset(decisions)


def test_location_state_cooldown_deduplicates(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)
    first_time = datetime(2026, 9, 4, 12, tzinfo=timezone.utc)
    first = monitor_once(
        db_path=path, dry_run=True, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [], now=first_time,
    )
    second = monitor_once(
        db_path=path, dry_run=True, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [],
        now=first_time + timedelta(minutes=10), cooldown_minutes=60,
    )
    assert first["dry_run_alerts"] == 1
    assert second["dry_run_alerts"] == 0
    assert second["skipped"] == 1
    with sqlite3.connect(path) as connection:
        decision = connection.execute(
            "SELECT decision FROM sentinel_events WHERE event_type = 'aerocast_ml' ORDER BY id DESC"
        ).fetchone()[0]
    assert decision == "deduplicated"


def test_official_and_ml_alerts_are_distinct(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)
    result = monitor_once(
        db_path=path, dry_run=True, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [{
            "id": "nws-123", "event": "Tornado Warning",
            "headline": "Official NWS warning", "area": "Houston",
            "expires": "2026-09-04T13:00:00Z", "instruction": "Take shelter",
        }],
    )
    assert result["dry_run_alerts"] == 1
    with sqlite3.connect(path) as connection:
        event_types = {row[0] for row in connection.execute("SELECT event_type FROM sentinel_events")}
    assert event_types == {"aerocast_ml", "official_nws"}
    with sqlite3.connect(path) as connection:
        decision = connection.execute(
            "SELECT decision FROM sentinel_events WHERE event_type = 'aerocast_ml'"
        ).fetchone()[0]
    assert decision == "suppressed_by_official_nws"


def test_live_delivery_is_logged_and_cooldown_prevents_resend(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)
    sent_to = []

    def fake_email(email, subject, body):
        sent_to.append((email, subject, body))

    first_time = datetime(2026, 9, 4, 12, tzinfo=timezone.utc)
    first = monitor_once(
        db_path=path, dry_run=False, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [],
        email_sender=fake_email, now=first_time,
    )
    second = monitor_once(
        db_path=path, dry_run=False, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [],
        email_sender=fake_email, now=first_time + timedelta(minutes=5),
        cooldown_minutes=60,
    )
    assert first["sent"] == 1
    assert second["sent"] == 0
    assert len(sent_to) == 1
    assert "experimental" in sent_to[0][1].lower()
    assert "not an official warning" in sent_to[0][2].lower()
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM alert_deliveries").fetchone()[0] == 1


def test_new_subscription_is_seen_by_sentinel(tmp_path):
    path = tmp_path / "sentinel.db"
    initialize_database(path)
    upsert_subscription("77002", "new@example.com", 29.7604, -95.3698, path)
    result = monitor_once(
        db_path=path, dry_run=True,
        predictor=lambda latitude, longitude: {"prediction": 0, "risk_probability": 5.0},
        official_alert_fetcher=lambda latitude, longitude: [],
    )
    assert result["checked"] == 1
    assert result["predictions"] == 1


def test_below_threshold_without_nws_does_not_notify(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)
    messages = []
    result = monitor_once(
        db_path=path, dry_run=False,
        predictor=lambda latitude, longitude: {"prediction": 0, "risk_probability": 20.0},
        official_alert_fetcher=lambda latitude, longitude: [],
        email_sender=lambda *args: messages.append(args),
    )
    assert result["sent"] == 0
    assert messages == []
    with sqlite3.connect(path) as connection:
        decisions = {row[0] for row in connection.execute("SELECT decision FROM sentinel_events")}
    assert {"no_alert", "no_active_alerts"}.issubset(decisions)


def test_live_official_alert_has_priority_and_required_content(tmp_path):
    path = tmp_path / "sentinel.db"
    add_user(path)
    messages = []
    result = monitor_once(
        db_path=path, dry_run=False, predictor=high_risk,
        official_alert_fetcher=lambda latitude, longitude: [{
            "id": "nws-456", "event": "Tornado Warning", "headline": "Take action",
            "area": "Harris County", "expires": "soon", "instruction": "Shelter now",
        }],
        email_sender=lambda *args: messages.append(args),
    )
    assert result["sent"] == 1
    assert len(messages) == 1
    assert messages[0][1].startswith("Official NWS Alert")
    assert "Harris County" in messages[0][2]
    assert "not issued by AeroCastAI" in messages[0][2]
