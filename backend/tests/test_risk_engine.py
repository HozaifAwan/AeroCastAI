import pytest

import risk_engine


class FakeResponse:
    def raise_for_status(self):
        return None

    def json(self):
        base = {
            "temperature_2m": 20,
            "dew_point_2m": 10,
            "relative_humidity_2m": 50,
            "surface_pressure": 1000,
            "wind_speed_10m": 12,
            "cloud_cover": 30,
            "cloud_cover_mid": 20,
            "precipitation": 0,
            "apparent_temperature": 20,
        }
        return {
            "current": {"time": "2026-09-04T15:00", **base},
            "hourly": {
                "time": ["2026-09-04T14:00", "2026-09-04T15:00", "2026-09-04T16:00"],
                **{name: [value - 1, value, value + 99] for name, value in base.items()},
            },
        }


def test_current_weather_is_used_instead_of_last_forecast(monkeypatch):
    monkeypatch.setattr(risk_engine.requests, "get", lambda *args, **kwargs: FakeResponse())
    weather = risk_engine.fetch_weather_features(35.4, -97.5)
    assert weather["temperature_2m"] == 20
    assert weather["temp_delta"] == 1
    assert weather["humidity_delta"] == 1
    assert weather["wind_delta"] == 1


def test_feature_vector_uses_canonical_order():
    weather = {name: index for index, name in enumerate(risk_engine.FEATURE_NAMES)}
    vector = risk_engine.create_feature_vector(weather)
    assert vector.shape == (1, 12)
    assert vector.tolist()[0] == list(range(12))


def test_missing_weather_value_is_rejected():
    weather = {name: 1 for name in risk_engine.FEATURE_NAMES}
    weather["cloud_cover_mid"] = None
    with pytest.raises(ValueError, match="cloud_cover_mid"):
        risk_engine.create_feature_vector(weather)
