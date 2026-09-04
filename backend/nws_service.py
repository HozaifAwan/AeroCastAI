"""Official National Weather Service alerts, separate from AeroCast ML output."""

import requests


def fetch_official_alerts(latitude: float, longitude: float) -> list[dict]:
    response = requests.get(
        "https://api.weather.gov/alerts/active",
        params={"point": f"{latitude},{longitude}"},
        headers={
            "User-Agent": "AeroCastAI/3.0 (aerocastai@gmail.com)",
            "Accept": "application/geo+json",
        },
        timeout=15,
    )
    response.raise_for_status()
    alerts = []
    for feature in response.json().get("features", []):
        properties = feature.get("properties", {})
        alerts.append({
            "id": properties.get("id"),
            "event": properties.get("event"),
            "severity": properties.get("severity"),
            "certainty": properties.get("certainty"),
            "urgency": properties.get("urgency"),
            "headline": properties.get("headline"),
            "description": properties.get("description"),
            "instruction": properties.get("instruction"),
            "area": properties.get("areaDesc"),
            "effective": properties.get("effective"),
            "expires": properties.get("expires"),
        })
    return alerts
