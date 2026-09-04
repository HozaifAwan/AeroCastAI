import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    return default if value is None else value.strip().lower() in {"1", "true", "yes", "on"}


def _env_path(name: str, default: Path) -> Path:
    value = os.getenv(name, "").strip()
    return Path(value) if value else default


@dataclass
class Settings:
    database_path: Path = _env_path(
        "DATABASE_PATH",
        _env_path("AEROCAST_DB_PATH", BASE_DIR / "aerocastai_weather.db"),
    )
    model_path: Path = _env_path("AEROCAST_MODEL_PATH", BASE_DIR / "aerocast_model_ultra.json")
    mailjet_api_key: str | None = os.getenv("MAILJET_API_KEY")
    mailjet_api_secret: str | None = os.getenv("MAILJET_API_SECRET")
    mailjet_from_email: str = os.getenv("MAILJET_FROM_EMAIL", "aerocastai@gmail.com")
    enable_test_email: bool = _env_bool("ENABLE_TEST_EMAIL")
    send_subscription_confirmation: bool = _env_bool(
        "SEND_SUBSCRIPTION_CONFIRMATION", False
    )
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    )
    sentinel_interval_seconds: int = int(os.getenv("SENTINEL_INTERVAL_SECONDS", "900"))
    sentinel_risk_threshold: float = float(os.getenv("SENTINEL_RISK_THRESHOLD", "0.60"))
    sentinel_alert_cooldown_minutes: int = int(
        os.getenv("SENTINEL_ALERT_COOLDOWN_MINUTES", "60")
    )
    sentinel_dry_run: bool = _env_bool("SENTINEL_DRY_RUN", True)

    def __post_init__(self) -> None:
        if self.sentinel_interval_seconds < 1:
            raise ValueError("SENTINEL_INTERVAL_SECONDS must be at least 1")
        if not 0 <= self.sentinel_risk_threshold <= 1:
            raise ValueError("SENTINEL_RISK_THRESHOLD must be between 0 and 1")
        if self.sentinel_alert_cooldown_minutes < 0:
            raise ValueError("SENTINEL_ALERT_COOLDOWN_MINUTES cannot be negative")


settings = Settings()
