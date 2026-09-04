import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 8, { duration: 0.8 });
  }, [map, position]);
  return null;
}

function RiskMap({ analysis, officialAlerts }) {
  const position = analysis ? [analysis.latitude, analysis.longitude] : null;
  const activeOfficial = officialAlerts?.[0];

  return (
    <section id="map" className="section-shell map-section">
      <div className="section-heading">
        <p className="eyebrow">Geospatial context</p>
        <h2>Location intelligence map</h2>
        <p>OpenStreetMap context for the latest selected prediction location.</p>
      </div>
      <div className="map-layout">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          scrollWheelZoom
          className="risk-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater position={position} />
          {position && (
            <Marker position={position}>
              <Popup>
                <strong>{analysis.location_name || 'Prediction location'}</strong><br />
                Experimental AeroCast score: {analysis.risk_probability}/100<br />
                Official NWS alerts: {officialAlerts ? officialAlerts.length : 'checking'}
              </Popup>
            </Marker>
          )}
        </MapContainer>
        <aside className={`nws-panel ${activeOfficial ? 'active' : ''}`}>
          <p className="panel-label">Official NWS alerts</p>
          {!analysis && <p>Select coordinates in the predictor to query location-specific alerts.</p>}
          {analysis && officialAlerts?.length === 0 && <p>No active official NWS alerts for this location.</p>}
          {analysis && officialAlerts === null && <p>Official alert status is pending or unavailable.</p>}
          {officialAlerts?.map((alert) => (
            <article className="nws-alert-card" key={alert.id || alert.headline}>
              <span>{alert.event || 'Weather alert'}</span>
              <h3>{alert.headline || 'Official National Weather Service alert'}</h3>
              <dl>
                <div><dt>Severity</dt><dd>{alert.severity || 'Unknown'}</dd></div>
                <div><dt>Urgency</dt><dd>{alert.urgency || 'Unknown'}</dd></div>
                <div><dt>Affected area</dt><dd>{alert.area || 'See alert details'}</dd></div>
                <div><dt>Expires</dt><dd>{alert.expires ? new Date(alert.expires).toLocaleString() : 'Not specified'}</dd></div>
              </dl>
              {alert.instruction && <p className="nws-instruction">{alert.instruction}</p>}
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}

export default RiskMap;
