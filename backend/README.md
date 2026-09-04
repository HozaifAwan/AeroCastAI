# AeroCastAI V3 Backend

AeroCastAI V3 is a FastAPI weather-risk intelligence service with a single ML
inference pipeline, separate official National Weather Service alerts,
database-backed subscriptions, and an autonomous Sentinel monitor.

> AeroCastAI model output is experimental risk intelligence. It is not an
> official tornado warning and must not replace NWS alerts, local authorities,
> or emergency guidance.

## Architecture

```text
Open-Meteo ──> risk_engine.py ──> FastAPI /predict
                       └────────> Sentinel ──> dry-run or Mailjet

NWS API ─────> nws_service.py ──> /official-alerts
                       └────────> Sentinel (distinct official alert state)

SQLite <──── database.py <──── subscriptions, predictions, cycles, decisions
```

- `risk_engine.py` is the only model-loading and feature-construction path.
- `nws_service.py` handles official alerts separately from model output.
- `sentinel.py` runs one cycle or continuously at a configured interval.
- `database.py` owns schema initialization and shared persistence operations.
- `config.py` loads safe environment-based settings, optionally from `.env`.
- `notifications.py` is the sole email-provider integration.

Legacy command and schema helper filenames remain for compatibility, but they
delegate to V3 services and do not define alternate runtime pipelines.

## Setup

Python 3.12 is supported.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

The repository uses `aerocast_model_ultra.json`, an XGBoost native model with a
strict 12-feature contract. Override it only with a compatible artifact.

## Environment variables

| Variable | Default | Purpose |
|---|---:|---|
| `MAILJET_API_KEY` | unset | Mailjet credential; never commit it |
| `MAILJET_API_SECRET` | unset | Mailjet credential; never commit it |
| `MAILJET_FROM_EMAIL` | `aerocastai@gmail.com` | Verified sender address |
| `SEND_SUBSCRIPTION_CONFIRMATION` | `false` | Send confirmation for new subscriptions |
| `SENTINEL_INTERVAL_SECONDS` | `900` | Delay between continuous cycles |
| `SENTINEL_RISK_THRESHOLD` | `0.60` | Experimental ML alert threshold, 0–1 |
| `SENTINEL_ALERT_COOLDOWN_MINUTES` | `60` | User/location/state deduplication window |
| `SENTINEL_DRY_RUN` | `true` | Suppress all Sentinel email delivery |
| `DATABASE_PATH` | repository-local SQLite file | Persistent database location |
| `AEROCAST_MODEL_PATH` | `aerocast_model_ultra.json` | Compatible model artifact |
| `CORS_ORIGINS` | local Vite origins | Comma-separated allowed origins |
| `ENABLE_TEST_EMAIL` | `false` | Enables hidden manual test endpoint |

Live Sentinel delivery requires all Mailjet settings and an explicit
`SENTINEL_DRY_RUN=false`. Dry-run is the fail-safe default.

## Run the API

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Core endpoints:

- `GET /` — service identity and safety disclaimer
- `GET /health` — model/database readiness
- `GET /system/status` — non-sensitive Sentinel configuration and last cycle
- `POST /predict` — experimental model score and contribution drivers
- `GET /official-alerts` — official NWS alerts, clearly labeled
- `POST /subscribe` — idempotent ZIP/email subscription
- `POST /test-email` — disabled and hidden by default
- `GET /alerts/recent` — recent Sentinel decisions with masked subscriber emails

Example prediction:

```json
{"latitude": 29.7604, "longitude": -95.3698}
```

## Run Sentinel

Run exactly one safe cycle:

```powershell
.\.venv\Scripts\python.exe sentinel.py --once
```

Run continuously using `SENTINEL_INTERVAL_SECONDS`:

```powershell
.\.venv\Scripts\python.exe sentinel.py
```

Every cycle is recorded in `monitoring_cycles`. Every ML decision, official NWS
state, dry-run action, cooldown skip, send, and error is recorded in
`sentinel_events`. Actual accepted email deliveries are also stored in
`alert_deliveries`. Deduplication keys combine subscriber, normalized location,
alert state, and the configured time window.

Official NWS alerts have notification priority. When one is active, Sentinel
records the ML state but sends only the official-alert message. Otherwise, an
ML message is eligible only when the score meets `SENTINEL_RISK_THRESHOLD`.

### Local subscription demo

1. Start the API and frontend, then submit a ZIP code and email in the signup form.
2. Confirm the subscription count increased with `GET /system/status`.
3. Keep `SENTINEL_DRY_RUN=true` and run:

   ```powershell
   .\.venv\Scripts\python.exe sentinel.py --once
   ```

4. Inspect the printed `checked` count and request `GET /alerts/recent` to see
   `dry_run`, `no_alert`, `no_active_alerts`, or `deduplicated` decisions. Email
   addresses in that endpoint are masked.

## Run tests

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
```

Tests use temporary SQLite databases and mocked weather, NWS, geocoding, and
email behavior. They do not send email or modify the production database.

## Security and deployment

- Keep `.env`, SQLite files, pickle files, and secrets out of Git.
- Put `DATABASE_PATH` on persistent storage in production.
- Rotate any credential that has ever appeared in repository history.
- Run Sentinel as a separate worker/process from the API.
- Keep `SENTINEL_DRY_RUN=true` until delivery configuration is deliberately
  validated.
