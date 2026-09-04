"""Autonomous monitor for experimental AeroCast risk and official NWS alerts."""

import argparse
import logging
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable

from config import settings
from database import database, initialize_database
from notifications import send_email
from nws_service import fetch_official_alerts
from risk_engine import predict_risk

logger = logging.getLogger("aerocast.sentinel")
DISCLAIMER = (
    "AeroCastAI output is experimental risk intelligence, not an official warning. "
    "Follow official NWS alerts and local emergency guidance."
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _location_key(latitude: float, longitude: float) -> str:
    return f"{latitude:.4f},{longitude:.4f}"


def _start_cycle(db_path: Path, dry_run: bool, now: datetime) -> int:
    with database(db_path) as connection:
        cursor = connection.execute(
            "INSERT INTO monitoring_cycles (started_at, dry_run, status) VALUES (?, ?, 'running')",
            (now.isoformat(), int(dry_run)),
        )
        return int(cursor.lastrowid)


def _log_event(
    db_path: Path,
    cycle_id: int,
    user_id: int | None,
    location_key: str | None,
    event_type: str,
    alert_state: str,
    decision: str,
    now: datetime,
    risk_probability: float | None = None,
    nws_alert_id: str | None = None,
    detail: str | None = None,
) -> None:
    with database(db_path) as connection:
        connection.execute("""
            INSERT INTO sentinel_events (
                cycle_id, user_id, created_at, location_key, event_type,
                alert_state, decision, risk_probability, nws_alert_id, detail
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cycle_id, user_id, now.isoformat(), location_key, event_type,
            alert_state, decision, risk_probability, nws_alert_id, detail,
        ))


def _recent_action_exists(
    db_path: Path,
    user_id: int,
    location_key: str,
    event_type: str,
    alert_state: str,
    now: datetime,
    cooldown_minutes: int,
) -> bool:
    cutoff = (now - timedelta(minutes=cooldown_minutes)).isoformat()
    with database(db_path) as connection:
        row = connection.execute("""
            SELECT 1 FROM sentinel_events
            WHERE user_id = ? AND location_key = ? AND event_type = ? AND alert_state = ?
              AND decision IN ('sent', 'dry_run') AND created_at >= ?
            LIMIT 1
        """, (user_id, location_key, event_type, alert_state, cutoff)).fetchone()
    return row is not None


def _deliver_or_log(
    *,
    db_path: Path,
    cycle_id: int,
    user,
    location_key: str,
    event_type: str,
    alert_state: str,
    subject: str,
    body: str,
    now: datetime,
    dry_run: bool,
    cooldown_minutes: int,
    email_sender: Callable[[str, str, str], None],
    risk_probability: float | None = None,
    nws_alert_id: str | None = None,
) -> str:
    if _recent_action_exists(
        db_path, user["id"], location_key, event_type, alert_state, now,
        cooldown_minutes
    ):
        _log_event(
            db_path, cycle_id, user["id"], location_key, event_type,
            alert_state, "deduplicated", now, risk_probability, nws_alert_id,
            f"Within {cooldown_minutes}-minute cooldown",
        )
        return "deduplicated"

    if dry_run:
        _log_event(
            db_path, cycle_id, user["id"], location_key, event_type,
            alert_state, "dry_run", now, risk_probability, nws_alert_id,
            "Email suppressed by SENTINEL_DRY_RUN",
        )
        logger.info("DRY RUN: would send %s alert to subscription %s", event_type, user["id"])
        return "dry_run"

    try:
        email_sender(user["email"], subject, body)
    except Exception as exc:
        _log_event(
            db_path, cycle_id, user["id"], location_key, event_type,
            alert_state, "failed", now, risk_probability, nws_alert_id,
            f"Email delivery failed: {type(exc).__name__}",
        )
        raise
    _log_event(
        db_path, cycle_id, user["id"], location_key, event_type,
        alert_state, "sent", now, risk_probability, nws_alert_id,
        "Email provider accepted message",
    )
    with database(db_path) as connection:
        connection.execute("""
            INSERT INTO alert_deliveries
                (user_id, sent_at, risk_probability, status, provider_message)
            VALUES (?, ?, ?, 'sent', ?)
        """, (
            user["id"], now.isoformat(), risk_probability or 0,
            f"{event_type}:{alert_state}",
        ))
    return "sent"


def monitor_once(
    *,
    db_path: Path | None = None,
    dry_run: bool | None = None,
    risk_threshold: float | None = None,
    cooldown_minutes: int | None = None,
    predictor: Callable[[float, float], dict] = predict_risk,
    official_alert_fetcher: Callable[[float, float], list[dict]] = fetch_official_alerts,
    email_sender: Callable[[str, str, str], None] = send_email,
    now: datetime | None = None,
) -> dict[str, int | bool]:
    path = Path(db_path or settings.database_path)
    is_dry_run = settings.sentinel_dry_run if dry_run is None else dry_run
    threshold = settings.sentinel_risk_threshold if risk_threshold is None else risk_threshold
    cooldown = (
        settings.sentinel_alert_cooldown_minutes
        if cooldown_minutes is None else cooldown_minutes
    )
    cycle_now = now or _now()
    initialize_database(path)
    cycle_id = _start_cycle(path, is_dry_run, cycle_now)
    counters: dict[str, int | bool] = {
        "cycle_id": cycle_id, "dry_run": is_dry_run, "checked": 0,
        "predictions": 0, "sent": 0, "dry_run_alerts": 0,
        "skipped": 0, "failed": 0,
    }

    with database(path) as connection:
        users = connection.execute(
            "SELECT id, email, zipcode, lat, lon FROM users WHERE email IS NOT NULL"
        ).fetchall()

    for user in users:
        counters["checked"] += 1
        if user["lat"] is None or user["lon"] is None:
            counters["failed"] += 1
            _log_event(
                path, cycle_id, user["id"], None, "system", "invalid_location",
                "error", cycle_now, detail="Subscription has no coordinates",
            )
            continue

        latitude, longitude = float(user["lat"]), float(user["lon"])
        location_key = _location_key(latitude, longitude)
        result = None
        official_alerts = []
        try:
            result = predictor(latitude, longitude)
            counters["predictions"] += 1
        except Exception as exc:
            counters["failed"] += 1
            _log_event(
                path, cycle_id, user["id"], location_key, "aerocast_ml",
                "unavailable", "error", cycle_now, detail=type(exc).__name__,
            )

        try:
            official_alerts = official_alert_fetcher(latitude, longitude)
        except Exception as exc:
            counters["failed"] += 1
            _log_event(
                path, cycle_id, user["id"], location_key, "official_nws",
                "unavailable", "error", cycle_now, detail=type(exc).__name__,
            )

        try:
            probability_percent = (
                float(result["risk_probability"]) if result is not None else None
            )
            probability = (
                probability_percent / 100 if probability_percent is not None else None
            )

            if official_alerts:
                if result is not None:
                    _log_event(
                        path, cycle_id, user["id"], location_key, "aerocast_ml",
                        "elevated" if probability >= threshold else "normal",
                        "suppressed_by_official_nws", cycle_now,
                        risk_probability=probability_percent,
                        detail="Official NWS alert takes notification priority",
                    )
                    counters["skipped"] += 1

                for alert in official_alerts:
                    alert_id = str(alert.get("id") or alert.get("headline") or "unknown")
                    decision = _deliver_or_log(
                        db_path=path, cycle_id=cycle_id, user=user,
                        location_key=location_key, event_type="official_nws",
                        alert_state=f"nws:{alert_id}", now=cycle_now, dry_run=is_dry_run,
                        cooldown_minutes=cooldown, email_sender=email_sender,
                        nws_alert_id=alert_id,
                        subject=f"Official NWS Alert: {alert.get('event') or 'Weather alert'}",
                        body=(
                            "Official NWS Alert\n\n"
                            f"Event: {alert.get('event') or 'Weather alert'}\n"
                            f"Headline: {alert.get('headline') or 'Not provided'}\n"
                            f"Area: {alert.get('area') or 'See official alert details'}\n"
                            f"Expires: {alert.get('expires') or 'Not specified'}\n\n"
                            f"Instructions: {alert.get('instruction') or 'Follow official local guidance.'}\n\n"
                            "Source: National Weather Service. This warning was not issued by AeroCastAI."
                        ),
                    )
                    if decision == "sent":
                        counters["sent"] += 1
                    elif decision == "dry_run":
                        counters["dry_run_alerts"] += 1
                    else:
                        counters["skipped"] += 1

            elif result is not None and probability >= threshold:
                weather = result.get("weather") or {}
                weather_summary = (
                    f"Temperature: {weather.get('temperature_2m', 'unavailable')} C\n"
                    f"Humidity: {weather.get('relative_humidity_2m', 'unavailable')}%\n"
                    f"Wind: {weather.get('wind_speed_10m', 'unavailable')} km/h\n"
                    f"Pressure: {weather.get('surface_pressure', 'unavailable')} hPa"
                )
                decision = _deliver_or_log(
                    db_path=path, cycle_id=cycle_id, user=user,
                    location_key=location_key, event_type="aerocast_ml",
                    alert_state="elevated", now=cycle_now, dry_run=is_dry_run,
                    cooldown_minutes=cooldown, email_sender=email_sender,
                    risk_probability=probability_percent,
                    subject="Experimental AeroCastAI ML Risk",
                    body=(
                        "Experimental AeroCastAI ML Risk\n\n"
                        f"Location: ZIP {user['zipcode']} ({latitude:.4f}, {longitude:.4f})\n"
                        f"Risk score: {probability_percent:.1f}/100\n\n"
                        f"Current weather inputs:\n{weather_summary}\n\n{DISCLAIMER}"
                    ),
                )
                if decision == "sent":
                    counters["sent"] += 1
                elif decision == "dry_run":
                    counters["dry_run_alerts"] += 1
                else:
                    counters["skipped"] += 1
            elif result is not None:
                counters["skipped"] += 1
                _log_event(
                    path, cycle_id, user["id"], location_key, "aerocast_ml",
                    "normal", "no_alert", cycle_now,
                    risk_probability=probability_percent,
                    detail=(
                        f"No official NWS alert; ML score is below the "
                        f"{threshold * 100:.1f}% threshold"
                    ),
                )
            if not official_alerts:
                _log_event(
                    path, cycle_id, user["id"], location_key, "official_nws",
                    "none", "no_active_alerts", cycle_now,
                    detail="NWS returned no active alerts",
                )
        except Exception as exc:
            logger.exception("Monitoring failed for subscription %s", user["id"])
            counters["failed"] += 1
            _log_event(
                path, cycle_id, user["id"], location_key, "system", "failure",
                "error", cycle_now, detail=type(exc).__name__,
            )

    status = "completed_with_errors" if counters["failed"] else "completed"
    with database(path) as connection:
        connection.execute("""
            UPDATE monitoring_cycles SET
                completed_at = ?, status = ?, subscriptions_checked = ?,
                predictions_evaluated = ?, emails_sent = ?, events_skipped = ?,
                failures = ? WHERE id = ?
        """, (
            _now().isoformat(), status, counters["checked"], counters["predictions"],
            counters["sent"], counters["skipped"], counters["failed"], cycle_id,
        ))
    logger.info("Sentinel cycle %s finished: %s", cycle_id, counters)
    return counters


def run_forever() -> None:
    logger.info(
        "Sentinel starting: interval=%ss dry_run=%s threshold=%.1f%% cooldown=%sm",
        settings.sentinel_interval_seconds, settings.sentinel_dry_run,
        settings.sentinel_risk_threshold * 100,
        settings.sentinel_alert_cooldown_minutes,
    )
    while True:
        monitor_once()
        time.sleep(settings.sentinel_interval_seconds)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run one cycle and exit")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    if args.once:
        print(monitor_once())
        return
    try:
        run_forever()
    except KeyboardInterrupt:
        logger.info("Sentinel stopped")


if __name__ == "__main__":
    main()
