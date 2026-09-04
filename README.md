# AeroCastAI V3

AeroCastAI V3 is a full-stack experimental weather-risk intelligence platform. It combines live meteorological observations, machine-learning inference, official National Weather Service (NWS) alerts, subscription monitoring, and a browser-based visualization layer in one repository.

> AeroCastAI is a research and portfolio project. Its model output is experimental risk intelligence—not a scientifically calibrated tornado probability or an official warning. Always follow NWS alerts and local emergency authorities for safety-critical decisions.

## Overview

The React frontend lets a user analyze coordinates, inspect current weather inputs and model contributors, see location context on a map, check official NWS alerts in a clearly separate view, and register an email/US ZIP-code subscription.

The FastAPI backend coordinates the system. It obtains live weather data from Open-Meteo, constructs the model's 12-feature input, runs an XGBoost model, records predictions in SQLite, retrieves official alerts independently from the NWS API, and stores subscriptions. A separate Sentinel process periodically evaluates saved locations and can send eligible notifications through Mailjet. Monitoring cycles and decisions are persisted for operational visibility.

## Key Features

- Live weather analysis for user-supplied latitude and longitude
- Experimental XGBoost weather-risk inference with leading model contributors
- Independent, explicitly labeled official NWS alert retrieval
- Reverse geocoding for analyzed coordinates and US ZIP-code geocoding for subscriptions
- Email and ZIP-code subscription storage
- SQLite persistence for subscriptions, predictions, monitoring cycles, decisions, and deliveries
- One-cycle or continuous Sentinel monitoring
- Mailjet email delivery with safe configuration defaults
- Subscriber/location/state cooldown-based alert deduplication
- Interactive React interface with current conditions and an OpenStreetMap-based location view
- Clear separation between experimental ML signals and official NWS alerts

## Architecture

```text
User / browser
      |
      v
React + Vite frontend
      |
      v
FastAPI REST API ------------------------------+
      |                                        |
      +--> Open-Meteo --> 12-feature vector --> XGBoost risk engine
      |                                        |
      +--> NWS API ------> official alerts     +--> SQLite
      |                                        |    (predictions and subscriptions)
      +--> Nominatim ----> location name       |
      +--> Zippopotam.us -> ZIP coordinates ---+

Sentinel worker --> saved subscriptions --> risk engine + NWS service
      |                                        |
      +--> cooldown/deduplication + logs ------> SQLite
      +--> dry-run or Mailjet notifications
```

The API and Sentinel reuse the same risk, NWS, database, configuration, and notification services. Official NWS state remains distinct from AeroCastAI model state throughout the API, interface, logs, and notification flow.

## How It Works

### Prediction workflow

1. The user submits latitude and longitude in the frontend.
2. FastAPI requests current and prior-hour weather data from Open-Meteo.
3. The risk engine builds the model's fixed 12-feature vector and runs the checked-in XGBoost artifact.
4. The backend returns an experimental score, classification, current conditions, and leading feature contributions.
5. The prediction is logged to SQLite.
6. The frontend separately requests active official NWS alerts for the same coordinates and displays them as official data, apart from the model result.

### Subscription workflow

1. A user submits a valid US ZIP code and email address.
2. The backend resolves the ZIP code to coordinates and stores or reuses the SQLite subscription.
3. Sentinel loads the saved subscriptions during each monitoring cycle.
4. It evaluates the location's current weather conditions and calculates the experimental ML risk score.
5. It checks official NWS alerts independently.
6. Official alerts receive notification priority; otherwise, an ML notification is eligible only when its configured threshold is met.
7. Subscriber, location, alert state, and cooldown data are used to prevent repeated notifications.
8. Sentinel records dry runs, sends, skips, errors, and other decisions. If live delivery is deliberately enabled and Mailjet is configured, it can send an appropriate email.

## Tech Stack

**Frontend**

- React 19 and React DOM
- Vite 6
- JavaScript and JSX
- Tailwind CSS 3 with PostCSS and Autoprefixer
- Leaflet and React Leaflet
- Framer Motion and React Icons
- ESLint

**Backend**

- Python 3.12
- FastAPI, Uvicorn, and Pydantic
- SQLite
- Requests and python-dotenv

**ML and data**

- XGBoost model inference
- NumPy feature construction
- A serialized XGBoost JSON model artifact
- Optional development/training dependencies: pandas, scikit-learn, and imbalanced-learn
- Open-Meteo live weather data

**External services**

- National Weather Service API for official alerts
- OpenStreetMap tiles and Nominatim reverse geocoding
- Zippopotam.us ZIP-code geocoding
- Mailjet email delivery

## Repository Structure

```text
AeroCastAI/
├── backend/
│   ├── tests/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── risk_engine.py
│   ├── nws_service.py
│   ├── sentinel.py
│   ├── notifications.py
│   ├── aerocast_model_ultra.json
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   └── README.md
└── README.md
```

See [backend/README.md](backend/README.md) for backend-specific operational details and [frontend/README.md](frontend/README.md) for frontend development guidance.

## Local Setup

Dependency directories and virtual environments are intentionally not committed. Create a local Python environment and reconstruct Node dependencies from the checked-in manifests.

### Clone

```bash
git clone https://github.com/HozaifAwan/AeroCastAI.git
cd AeroCastAI
```

### Backend Setup

From the repository root:

```bash
cd backend
python -m venv .venv
```

Windows Command Prompt activation:

```cmd
.venv\Scripts\activate
```

PowerShell activation:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the runtime dependencies:

```bash
pip install -r requirements.txt
```

The `.venv` directory is ignored by Git. `requirements.txt` recreates the backend runtime dependencies; use `requirements-dev.txt` when running the test suite or training utilities.

### Backend Environment

Copy `backend/.env.example` to `backend/.env`:

```powershell
Copy-Item .env.example .env
```

The template defines the following settings:

| Variable | Purpose |
|---|---|
| `MAILJET_API_KEY` | Mailjet API credential |
| `MAILJET_API_SECRET` | Mailjet secret credential |
| `MAILJET_FROM_EMAIL` | Verified sender address |
| `CORS_ORIGINS` | Comma-separated browser origins allowed by FastAPI |
| `DATABASE_PATH` | Optional SQLite database location override |
| `AEROCAST_MODEL_PATH` | Optional compatible model artifact override |
| `ENABLE_TEST_EMAIL` | Enables the hidden manual test-email endpoint |
| `SEND_SUBSCRIPTION_CONFIRMATION` | Enables email confirmation for newly created subscriptions |
| `SENTINEL_INTERVAL_SECONDS` | Delay between continuous Sentinel cycles |
| `SENTINEL_RISK_THRESHOLD` | Experimental ML notification threshold, from 0 to 1 |
| `SENTINEL_ALERT_COOLDOWN_MINUTES` | Deduplication cooldown window |
| `SENTINEL_DRY_RUN` | Suppresses Sentinel email delivery when `true` |

Keep real credentials only in `backend/.env`; that file is ignored and must never be committed. Empty path values use repository-local defaults.

### Run Backend

From `backend/` with the virtual environment active:

```bash
python -m uvicorn main:app --reload --port 8001
```

The API is then available at <http://127.0.0.1:8001>, with interactive FastAPI documentation at <http://127.0.0.1:8001/docs>.

## Frontend Setup

From the repository root:

```bash
cd frontend
npm install
```

`node_modules` is intentionally ignored. `npm install` reconstructs dependencies using `package.json` and `package-lock.json`.

### Frontend Environment

Copy `frontend/.env.example` to `frontend/.env`:

```powershell
Copy-Item .env.example .env
```

The frontend reads one setting:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001
```

Set the copied template to port `8001` so it matches the backend command above. (The checked-in template and API client's fallback use port `8000`, which is also the backend's default when `main.py` is run directly.) The local `.env` file is ignored by Git.

### Run Frontend

```bash
npm run dev
```

Vite normally serves the interface at <http://localhost:5173>.

## Running AeroCastAI

Local development requires two processes. Keeping both applications in one repository does not make them a single runtime process.

**Terminal 1 — API**

```bash
cd backend
python -m uvicorn main:app --reload --port 8001
```

**Terminal 2 — web interface**

```bash
cd frontend
npm run dev
```

The frontend calls the backend address configured by `VITE_API_BASE_URL`. Ensure the frontend origin is included in the backend's `CORS_ORIGINS` setting.

## Sentinel Monitoring

Sentinel is a backend worker, separate from the web API. It loads stored subscriptions, evaluates each location through the shared risk engine, checks active NWS alerts through the separate official-alert service, applies notification priority and cooldown rules, and records every monitoring cycle and decision in SQLite.

Run one cycle from `backend/`:

```bash
python sentinel.py --once
```

This processes the subscriptions currently stored in the configured database once and exits. With the default `SENTINEL_DRY_RUN=true`, eligible emails are suppressed but the decisions are logged.

Run continuously at `SENTINEL_INTERVAL_SECONDS`:

```bash
python sentinel.py
```

Live delivery requires valid Mailjet credentials and deliberate environment configuration. Keep dry-run enabled until the sender, recipients, thresholds, and cooldown behavior have been reviewed.

## Testing

Install backend development dependencies, then run the test suite from `backend/`:

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

The backend tests cover API behavior, database initialization, feature construction, Sentinel dry-run and delivery logic, NWS/ML separation, and cooldown deduplication using temporary databases and mocked external services.

Optional Python syntax/import compilation check:

```bash
python -m compileall -q .
```

From `frontend/`, use the scripts defined in `package.json`:

```bash
npm run lint
npm run build
```

For an end-to-end smoke check, start both development processes, open the Vite URL, confirm the API status indicator is online, and exercise a coordinate analysis and subscription with non-sensitive test data. Live weather, geocoding, map, and NWS features require network access.

## Security / Secrets

- Local `.env` files are ignored; `.env.example` files contain configuration templates only.
- Never commit Mailjet credentials or any other API secrets.
- SQLite database files, Python virtual environments, Python caches, frontend build output, and `node_modules` are ignored and reconstructed or generated locally.
- Treat any credential ever exposed in source control as compromised and rotate it.

## Disclaimer

AeroCastAI is experimental research and portfolio software. Its ML-generated risk score is not a guaranteed or scientifically calibrated tornado probability, and it is not an official weather warning. Official NWS alerts are obtained and presented separately from AeroCastAI output. Rely on the National Weather Service and local emergency authorities for warnings, instructions, and safety-critical decisions.
