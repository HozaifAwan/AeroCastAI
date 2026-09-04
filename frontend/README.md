# AeroCastAI V3 Frontend

## Overview

This directory contains the React and Vite web interface for AeroCastAI V3. Through the frontend, users can:

- Submit latitude and longitude for live weather-risk analysis
- View the experimental model's score, classification, current weather inputs, hourly changes, and leading contributors
- Check official National Weather Service alerts independently for the analyzed location
- View the selected location and alert count on an interactive OpenStreetMap-based map
- See backend health and Sentinel dry-run/live status
- Register an email and US ZIP code for Sentinel monitoring
- Read project, weather-safety, historical, technical, and FAQ content

API-powered features require the AeroCastAI FastAPI backend. The interface does not run the model, retrieve NWS alerts, or send notifications by itself.

## Frontend Stack

- React 19 and React DOM
- Vite 6
- JavaScript and JSX
- Tailwind CSS 3, PostCSS, and Autoprefixer
- Leaflet and React Leaflet for maps
- Framer Motion for interface transitions
- React Icons
- ESLint

## Frontend Structure

```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── client.js          # Shared FastAPI client
│   ├── components/
│   │   ├── LivePredictor.jsx  # Coordinate analysis and model result
│   │   ├── LiveAlert.jsx      # Separate official NWS status banner
│   │   ├── RiskMap.jsx        # Location map and NWS alert details
│   │   ├── SystemStatus.jsx   # API/model/Sentinel status
│   │   └── ZipSignup.jsx      # ZIP-code and email subscription form
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── eslint.config.js
├── package.json
├── package-lock.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Installation

From the repository root:

```bash
cd frontend
npm install
```

The `node_modules` directory is intentionally ignored. Dependencies are reconstructed locally from `package.json` and `package-lock.json`.

## Environment Configuration

Copy the provided template to a local environment file:

```powershell
Copy-Item .env.example .env
```

The frontend reads:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001
```

`VITE_API_BASE_URL` controls the FastAPI server address. After copying the template, set it to port `8001` to match the backend command documented below. The checked-in template and client fallback use port `8000`, so either port works when both processes are configured consistently. Restart Vite after changing environment variables. The backend must be running for prediction, official-alert, status, and subscription features.

## Development Server

```bash
npm run dev
```

Vite normally serves the frontend at <http://localhost:5173>. Ensure this origin is allowed by the backend's `CORS_ORIGINS` configuration.

## Production Build

Create an optimized build:

```bash
npm run build
```

Check the source with the configured ESLint rules:

```bash
npm run lint
```

Preview the production build locally:

```bash
npm run preview
```

These commands correspond to the scripts in `package.json`. Vite writes production output to the ignored `dist/` directory.

## Backend Connection

All backend requests go through `src/api/client.js`. The client uses `VITE_API_BASE_URL`, removes a trailing slash, and exposes calls for:

- Service identity and health
- System and Sentinel status
- Experimental coordinate-based prediction
- Official NWS alerts for coordinates
- ZIP-code and email subscriptions
- Recent Sentinel activity (available in the client, though not currently rendered by the main interface)

Run the backend from the repository's `backend/` directory:

```bash
python -m uvicorn main:app --reload --port 8001
```

See the [root README](../README.md) for complete setup and the [backend README](../backend/README.md) for API and Sentinel details.

## Important Safety Note

The UI labels AeroCastAI output as an experimental model risk score and displays official NWS alerts in a distinct status banner and map panel. The score is not a guaranteed or scientifically calibrated tornado probability. The frontend does not issue official emergency warnings and does not replace the National Weather Service or local emergency authorities.
