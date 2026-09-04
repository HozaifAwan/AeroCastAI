import { useState } from 'react';
import { api } from '../api/client';

const weatherFields = [
  ['temperature_2m', 'Temperature', '°C'],
  ['dew_point_2m', 'Dew point', '°C'],
  ['relative_humidity_2m', 'Relative humidity', '%'],
  ['surface_pressure', 'Surface pressure', 'hPa'],
  ['wind_speed_10m', 'Wind speed', 'km/h'],
  ['cloud_cover', 'Cloud cover', '%'],
  ['cloud_cover_mid', 'Mid-level cloud', '%'],
  ['precipitation', 'Precipitation', 'mm'],
  ['apparent_temperature', 'Feels like', '°C'],
];

const deltaFields = [
  ['temp_delta', 'Temperature Δ', '°C/hr'],
  ['humidity_delta', 'Humidity Δ', '%/hr'],
  ['wind_delta', 'Wind Δ', 'km/h/hr'],
];

function numberInput(value, min, max, label) {
  if (value.trim() === '') throw new Error(`${label} is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function LivePredictor({ onAnalysis, onAlerts, onAlertsLoading, onAlertsError }) {
  const [latitude, setLatitude] = useState('29.7604');
  const [longitude, setLongitude] = useState('-95.3698');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    let lat;
    let lon;
    try {
      lat = numberInput(latitude, -90, 90, 'Latitude');
      lon = numberInput(longitude, -180, 180, 'Longitude');
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setLoading(true);
    setResult(null);
    onAnalysis(null);
    onAlerts(null);
    onAlertsError('');
    try {
      const prediction = await api.predict(lat, lon);
      setResult(prediction);
      onAnalysis(prediction);
      onAlertsLoading(true);
      try {
        const official = await api.officialAlerts(lat, lon);
        onAlerts(official.alerts);
      } catch (alertsFailure) {
        onAlertsError(alertsFailure.message);
      } finally {
        onAlertsLoading(false);
      }
    } catch (requestError) {
      setError(requestError.message || 'The risk analysis could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="predictor" className="section-shell predictor-section">
      <div className="section-heading">
        <p className="eyebrow">Live atmospheric analysis</p>
        <h2>Experimental AeroCastAI ML Risk</h2>
        <p>Evaluate current conditions at a specific latitude and longitude using the V3 model pipeline.</p>
      </div>

      <div className="predictor-grid">
        <form className="instrument-panel predictor-form" onSubmit={handleSubmit}>
          <div className="panel-label">Location input</div>
          <label>
            Latitude
            <input
              type="number" step="any" min="-90" max="90" value={latitude}
              onChange={(event) => setLatitude(event.target.value)} disabled={loading}
            />
          </label>
          <label>
            Longitude
            <input
              type="number" step="any" min="-180" max="180" value={longitude}
              onChange={(event) => setLongitude(event.target.value)} disabled={loading}
            />
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Analyzing live conditions…' : 'Run risk analysis'}
          </button>
          {error && <div className="error-message" role="alert">{error}</div>}
          <p className="safety-copy">
            AeroCastAI ML output is experimental and does not replace official NWS alerts or emergency guidance.
          </p>
        </form>

        <div className="instrument-panel result-panel" aria-live="polite">
          {!result && !loading && (
            <div className="empty-reading">
              <span className="radar-pip" />
              Awaiting a location analysis.
            </div>
          )}
          {loading && <div className="loading-reading"><span className="spinner" />Constructing the 12-feature weather vector…</div>}
          {result && (
            <>
              <div className="result-header">
                <div>
                  <p className="panel-label">Experimental model output</p>
                  <h3>{result.location_name || `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`}</h3>
                </div>
                <div className={`classification ${result.prediction === 1 ? 'elevated' : 'nominal'}`}>
                  {result.prediction === 1 ? 'Elevated signal' : 'No elevated signal'}
                </div>
              </div>
              <div className="risk-readout">
                <span>{Number(result.risk_probability).toFixed(2)}</span><small>/ 100 risk score</small>
              </div>
              <p className="reading-note">This score is a model output, not a guaranteed tornado probability.</p>

              <div className="weather-grid">
                {weatherFields.map(([key, label, unit]) => (
                  <div key={key}><span>{label}</span><strong>{result[key]} {unit}</strong></div>
                ))}
              </div>
              <div className="delta-grid">
                {deltaFields.map(([key, label, unit]) => (
                  <div key={key}><span>{label}</span><strong>{Number(result[key]).toFixed(2)} {unit}</strong></div>
                ))}
              </div>
              {result.drivers?.length > 0 && (
                <div className="drivers">
                  <h4>Leading model contributors</h4>
                  {result.drivers.map((driver) => (
                    <div className="driver-row" key={driver.feature}>
                      <span>{driver.feature.replaceAll('_', ' ')}</span>
                      <span className={driver.direction === 'higher' ? 'driver-up' : 'driver-down'}>
                        {driver.direction} contribution
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default LivePredictor;
