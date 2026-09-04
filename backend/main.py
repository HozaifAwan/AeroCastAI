import logging
import os
from contextlib import asynccontextmanager

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from config import settings
from database import (
    database,
    initialize_database,
    log_prediction,
    upsert_subscription,
    utc_now_iso,
)
from notifications import send_email
from nws_service import fetch_official_alerts
from risk_engine import model, predict_risk

logger = logging.getLogger("aerocast")
DISCLAIMER = (
    "AeroCastAI provides experimental ML risk intelligence, not an official "
    "tornado warning. Follow official NWS alerts and local emergency guidance."
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="AeroCastAI V3 API",
    version="3.0.0",
    description="Experimental ML-assisted tornado risk intelligence platform.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class Location(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class SubscribeRequest(BaseModel):
    zipcode: str = Field(pattern=r"^\d{5}(?:-\d{4})?$")
    email: EmailStr


class EmailRequest(BaseModel):
    email: EmailStr


def reverse_geocode(latitude: float, longitude: float) -> str:
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": latitude, "lon": longitude, "format": "json"},
            headers={"User-Agent": "AeroCastAI/3.0 (aerocastai@gmail.com)"},
            timeout=10,
        )
        response.raise_for_status()
        address = response.json().get("address", {})
        city = address.get("city") or address.get("town") or address.get("village") or address.get("county") or ""
        return ", ".join(part for part in [city, address.get("state", ""), address.get("country", "")] if part)
    except (requests.RequestException, ValueError, KeyError):
        logger.warning("Reverse geocoding failed", exc_info=True)
        return ""


def geocode_zip(zipcode: str) -> tuple[float, float]:
    try:
        response = requests.get(f"https://api.zippopotam.us/us/{zipcode}", timeout=10)
        response.raise_for_status()
        place = response.json()["places"][0]
        return float(place["latitude"]), float(place["longitude"])
    except (requests.RequestException, ValueError, KeyError, IndexError) as exc:
        raise HTTPException(status_code=400, detail="Unable to locate that ZIP code.") from exc


@app.get("/")
def root():
    return {"name": "AeroCastAI", "version": "3.0.0", "status": "online", "disclaimer": DISCLAIMER}


@app.get("/health")
def health():
    try:
        with database() as connection:
            connection.execute("SELECT 1").fetchone()
        return {
            "status": "healthy",
            "model": "loaded",
            "model_features": int(model.n_features_in_),
            "database": "connected",
            "timestamp": utc_now_iso(),
        }
    except Exception as exc:
        logger.exception("Health check failed")
        raise HTTPException(status_code=503, detail="A required service is unavailable.") from exc


@app.get("/system/status")
def system_status():
    with database() as connection:
        subscription_count = connection.execute(
            "SELECT COUNT(*) FROM users"
        ).fetchone()[0]
        last_cycle = connection.execute("""
            SELECT id, started_at, completed_at, dry_run, status,
                   subscriptions_checked, predictions_evaluated, emails_sent,
                   events_skipped, failures
            FROM monitoring_cycles ORDER BY id DESC LIMIT 1
        """).fetchone()
    return {
        "api": "online",
        "model": "loaded",
        "sentinel": {
            "configured_dry_run": settings.sentinel_dry_run,
            "interval_seconds": settings.sentinel_interval_seconds,
            "risk_threshold_percent": settings.sentinel_risk_threshold * 100,
            "cooldown_minutes": settings.sentinel_alert_cooldown_minutes,
            "last_cycle": dict(last_cycle) if last_cycle else None,
        },
        "subscriptions": subscription_count,
        "timestamp": utc_now_iso(),
    }


@app.get("/alerts/recent")
def recent_alert_activity(limit: int = Query(default=25, ge=1, le=100)):
    """Return non-sensitive Sentinel decisions for local operations visibility."""
    with database() as connection:
        rows = connection.execute("""
            SELECT se.id, se.cycle_id, se.created_at, se.event_type,
                   se.alert_state, se.decision, se.risk_probability,
                   se.nws_alert_id, se.detail, u.email
            FROM sentinel_events AS se
            LEFT JOIN users AS u ON u.id = se.user_id
            ORDER BY se.id DESC LIMIT ?
        """, (limit,)).fetchall()
    activity = []
    for row in rows:
        item = dict(row)
        email = item.pop("email", None)
        if email and "@" in email:
            local, domain = email.split("@", 1)
            item["subscriber"] = f"{local[:1]}***@{domain}"
        else:
            item["subscriber"] = None
        activity.append(item)
    return {"count": len(activity), "activity": activity}


@app.post("/predict")
def predict(location: Location):
    try:
        result = predict_risk(location.latitude, location.longitude)
    except requests.RequestException as exc:
        logger.warning("Weather request failed", exc_info=True)
        raise HTTPException(status_code=502, detail="Live weather service is unavailable.") from exc
    except (ValueError, KeyError, IndexError) as exc:
        logger.warning("Invalid weather payload", exc_info=True)
        raise HTTPException(status_code=502, detail="Live weather data is incomplete.") from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction could not be completed.") from exc

    location_name = reverse_geocode(location.latitude, location.longitude)
    timestamp = utc_now_iso()
    weather = result["weather"]
    response = {
        "timestamp": timestamp,
        "latitude": location.latitude,
        "longitude": location.longitude,
        **weather,
        "prediction": result["prediction"],
        "confidence": result["risk_probability"],
        "risk_probability": result["risk_probability"],
        "drivers": result["drivers"],
        "location_name": location_name,
        "disclaimer": result["disclaimer"],
    }
    try:
        log_prediction(
            timestamp, location.latitude, location.longitude, location_name, result
        )
    except Exception:
        logger.exception("Prediction logging failed")
    return response


@app.get("/official-alerts")
def official_alerts(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
):
    try:
        alerts = fetch_official_alerts(latitude, longitude)
    except (requests.RequestException, ValueError) as exc:
        logger.warning("NWS alert request failed", exc_info=True)
        raise HTTPException(status_code=502, detail="Official NWS alert service is unavailable.") from exc

    return {"source": "National Weather Service", "official": True, "count": len(alerts), "alerts": alerts}


@app.post("/subscribe")
def subscribe(req: SubscribeRequest):
    latitude, longitude = geocode_zip(req.zipcode)
    email = str(req.email).lower()
    _, created = upsert_subscription(req.zipcode, email, latitude, longitude)

    email_status = "disabled"
    if settings.send_subscription_confirmation:
        email_status = "not_configured"
        if settings.mailjet_api_key and settings.mailjet_api_secret:
            if not created:
                email_status = "not_sent_duplicate"
            else:
                try:
                    send_email(
                        email,
                        "AeroCastAI risk monitoring subscription",
                        f"Your AeroCastAI subscription for ZIP {req.zipcode} is active.\n\n{DISCLAIMER}",
                    )
                    email_status = "sent"
                except RuntimeError:
                    logger.exception("Subscription email failed")
                    email_status = "failed"
    return {
        "message": "Subscribed successfully." if created else "Subscription already exists.",
        "created": created, "zipcode": req.zipcode, "latitude": latitude,
        "longitude": longitude, "email_status": email_status, "disclaimer": DISCLAIMER,
    }


@app.post("/test-email", include_in_schema=False)
def test_email(req: EmailRequest):
    if not settings.enable_test_email:
        raise HTTPException(status_code=404, detail="Not found.")
    try:
        send_email(str(req.email), "AeroCastAI email test", DISCLAIMER)
    except RuntimeError as exc:
        logger.warning("Test email failed", exc_info=True)
        raise HTTPException(status_code=503, detail="Email service is unavailable.") from exc
    return {"message": "Test email sent."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
