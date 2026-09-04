from datetime import datetime
from math import isfinite

import numpy as np
import requests
import xgboost as xgb

from config import settings

FEATURE_NAMES = [
    "temperature_2m", "dew_point_2m", "relative_humidity_2m",
    "surface_pressure", "wind_speed_10m", "cloud_cover",
    "cloud_cover_mid", "precipitation", "apparent_temperature",
    "temp_delta", "humidity_delta", "wind_delta",
]
BASE_WEATHER_FEATURES = FEATURE_NAMES[:9]


def _load_model() -> xgb.XGBClassifier:
    if not settings.model_path.is_file():
        raise RuntimeError(f"Model artifact not found: {settings.model_path.name}")
    loaded = xgb.XGBClassifier()
    loaded.load_model(settings.model_path)
    if loaded.n_features_in_ != len(FEATURE_NAMES):
        raise RuntimeError(
            f"Model expects {loaded.n_features_in_} features; expected {len(FEATURE_NAMES)}"
        )
    model_names = list(loaded.get_booster().feature_names or [])
    if model_names and model_names != FEATURE_NAMES:
        raise RuntimeError("Model feature names do not match the V3 feature contract")
    return loaded


model = _load_model()


def _number(value, name: str) -> float:
    if value is None:
        raise ValueError(f"Weather service returned no value for {name}")
    number = float(value)
    if not isfinite(number):
        raise ValueError(f"Weather service returned an invalid value for {name}")
    return number


def fetch_weather_features(latitude: float, longitude: float) -> dict[str, float]:
    """Build the model contract from the current and previous UTC hours."""
    response = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(BASE_WEATHER_FEATURES),
            "hourly": ",".join(BASE_WEATHER_FEATURES),
            "past_days": 1,
            "forecast_days": 1,
            "timezone": "UTC",
        },
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    current_payload = payload.get("current") or {}
    hourly = payload.get("hourly") or {}
    current = {
        name: _number(current_payload.get(name), name)
        for name in BASE_WEATHER_FEATURES
    }

    current_time = current_payload.get("time")
    times = hourly.get("time") or []
    if not current_time or len(times) < 2:
        raise ValueError("Weather service returned insufficient hourly history")
    current_dt = datetime.fromisoformat(current_time)
    eligible = [
        index for index, value in enumerate(times)
        if datetime.fromisoformat(value) <= current_dt
    ]
    if not eligible or eligible[-1] == 0:
        raise ValueError("Weather service returned no previous hourly observation")
    previous_index = eligible[-1] - 1
    previous = {}
    for name in BASE_WEATHER_FEATURES:
        values = hourly.get(name) or []
        if previous_index >= len(values):
            raise ValueError(f"Weather service returned insufficient history for {name}")
        previous[name] = _number(values[previous_index], name)

    current["temp_delta"] = current["temperature_2m"] - previous["temperature_2m"]
    current["humidity_delta"] = current["relative_humidity_2m"] - previous["relative_humidity_2m"]
    current["wind_delta"] = current["wind_speed_10m"] - previous["wind_speed_10m"]
    return current


def create_feature_vector(weather: dict[str, float]) -> np.ndarray:
    return np.asarray(
        [[_number(weather.get(name), name) for name in FEATURE_NAMES]],
        dtype=np.float32,
    )


def _explain(features: np.ndarray, weather: dict[str, float]) -> list[dict]:
    matrix = xgb.DMatrix(features, feature_names=FEATURE_NAMES)
    contributions = model.get_booster().predict(matrix, pred_contribs=True)[0][:-1]
    ranked = sorted(
        zip(FEATURE_NAMES, contributions), key=lambda item: abs(item[1]), reverse=True
    )[:5]
    return [
        {
            "feature": name,
            "value": round(float(weather[name]), 3),
            "contribution": round(float(contribution), 4),
            "direction": "higher" if contribution >= 0 else "lower",
        }
        for name, contribution in ranked
    ]


def predict_risk(latitude: float, longitude: float) -> dict:
    weather = fetch_weather_features(latitude, longitude)
    features = create_feature_vector(weather)
    probability = float(model.predict_proba(features)[0][1])
    return {
        "prediction": int(probability >= 0.5),
        "risk_probability": round(probability * 100, 2),
        "weather": weather,
        "latitude": latitude,
        "longitude": longitude,
        "model_features": FEATURE_NAMES,
        "drivers": _explain(features, weather),
        "disclaimer": (
            "Experimental ML risk intelligence—not an official tornado warning. "
            "Follow official NWS alerts and local emergency guidance."
        ),
    }
