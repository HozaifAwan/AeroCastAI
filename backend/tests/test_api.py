import sqlite3

import pytest
from fastapi.testclient import TestClient

import main
from config import settings
from main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "database_path", tmp_path / "test.db")
    monkeypatch.setattr(settings, "sentinel_dry_run", True)
    monkeypatch.setattr(settings, "send_subscription_confirmation", False)
    with TestClient(app) as test_client:
        yield test_client


def fake_prediction():
    weather = {
        "temperature_2m": 25, "dew_point_2m": 20,
        "relative_humidity_2m": 73, "surface_pressure": 1002,
        "wind_speed_10m": 18, "cloud_cover": 70, "cloud_cover_mid": 60,
        "precipitation": 1, "apparent_temperature": 27,
        "temp_delta": 1, "humidity_delta": 2, "wind_delta": 3,
    }
    return {
        "prediction": 0, "risk_probability": 12.5, "weather": weather,
        "drivers": [{"feature": "wind_speed_10m", "value": 18,
                     "contribution": 0.2, "direction": "higher"}],
        "disclaimer": main.DISCLAIMER,
    }


def test_root_discloses_experimental_status(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "not an official tornado warning" in response.json()["disclaimer"]


def test_health_checks_isolated_database(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_features"] == 12
    assert response.json()["database"] == "connected"


def test_system_status_exposes_safe_sentinel_state(client):
    response = client.get("/system/status")
    assert response.status_code == 200
    assert response.json()["sentinel"]["configured_dry_run"] is True
    assert response.json()["sentinel"]["last_cycle"] is None


@pytest.mark.parametrize("origin", ["http://localhost:5173", "http://127.0.0.1:5173"])
def test_local_frontend_origins_are_allowed(client, origin):
    response = client.options(
        "/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_predict_returns_and_logs_result(client, monkeypatch):
    monkeypatch.setattr(main, "predict_risk", lambda latitude, longitude: fake_prediction())
    monkeypatch.setattr(main, "reverse_geocode", lambda latitude, longitude: "Houston, Texas")
    response = client.post("/predict", json={"latitude": 29.7604, "longitude": -95.3698})
    assert response.status_code == 200
    assert response.json()["risk_probability"] == 12.5
    assert response.json()["location_name"] == "Houston, Texas"
    with sqlite3.connect(settings.database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM prediction_logs").fetchone()[0] == 1


def test_coordinates_are_validated_before_prediction(client):
    assert client.post("/predict", json={"latitude": 91, "longitude": 0}).status_code == 422


def test_official_alerts_are_labeled_and_mapped(client, monkeypatch):
    monkeypatch.setattr(main, "fetch_official_alerts", lambda latitude, longitude: [{
        "id": "nws-1", "event": "Tornado Warning", "headline": "Official alert"
    }])
    response = client.get("/official-alerts?latitude=29.7604&longitude=-95.3698")
    assert response.status_code == 200
    assert response.json()["official"] is True
    assert response.json()["source"] == "National Weather Service"
    assert response.json()["alerts"][0]["id"] == "nws-1"


def test_subscription_insert_and_dedup(client, monkeypatch):
    monkeypatch.setattr(main, "geocode_zip", lambda zipcode: (29.7604, -95.3698))
    payload = {"zipcode": "77002", "email": "Person@example.com"}
    first = client.post("/subscribe", json=payload)
    second = client.post("/subscribe", json=payload)
    assert first.status_code == 200 and first.json()["created"] is True
    assert second.status_code == 200 and second.json()["created"] is False
    with sqlite3.connect(settings.database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 1
        row = connection.execute("SELECT email, zipcode, lat, lon FROM users").fetchone()
    assert row == ("person@example.com", "77002", 29.7604, -95.3698)


def test_subscription_does_not_email_when_confirmation_disabled(client, monkeypatch):
    monkeypatch.setattr(main, "geocode_zip", lambda zipcode: (29.7604, -95.3698))
    monkeypatch.setattr(
        main, "send_email",
        lambda *args: pytest.fail("Subscription unexpectedly sent an email"),
    )
    response = client.post(
        "/subscribe", json={"zipcode": "77002", "email": "person@example.com"}
    )
    assert response.status_code == 200
    assert response.json()["email_status"] == "disabled"


def test_recent_alert_activity_masks_subscriber_email(client):
    with sqlite3.connect(settings.database_path) as connection:
        user_id = connection.execute(
            """INSERT INTO users (zipcode, lat, lon, email, subscribed_at)
               VALUES ('77002', 29.7604, -95.3698, 'person@example.com', 'now')"""
        ).lastrowid
        cycle_id = connection.execute(
            "INSERT INTO monitoring_cycles (started_at, dry_run, status) "
            "VALUES ('now', 1, 'completed')"
        ).lastrowid
        connection.execute(
            """INSERT INTO sentinel_events
               (cycle_id, user_id, created_at, event_type, alert_state, decision)
               VALUES (?, ?, 'now', 'aerocast_ml', 'normal', 'no_alert')""",
            (cycle_id, user_id),
        )
    response = client.get("/alerts/recent")
    assert response.status_code == 200
    assert response.json()["activity"][0]["subscriber"] == "p***@example.com"
    assert "email" not in response.json()["activity"][0]


def test_email_test_route_is_disabled_by_default(client):
    response = client.post("/test-email", json={"email": "person@example.com"})
    assert response.status_code == 404
