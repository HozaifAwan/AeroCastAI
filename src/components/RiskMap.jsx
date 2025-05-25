import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L for leaflet-velocity
import WindyVelocityLayer from './WindyVelocityLayer'; // We'll create this component

const { BaseLayer, Overlay } = LayersControl;

// It's good practice to define default icon for markers if not using a custom one
// This can help avoid issues with Webpack/Parcel not finding default icon images
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


function MapUpdater({ markerCoords }) {
  const map = useMap();
  if (markerCoords) {
    map.setView(markerCoords, 8); // Zoom in on marker
  }
  return null;
}

function RiskMap({ markerCoords }) {
  const OWM_KEY = "3df8bd6a099b05c2b476699eee81484b"; // Your OpenWeatherMap API key

  // Demo wind data URL (replace with your own GRIB2 JSON source for live data)
  // This data is for global wind at a specific time.
  const windDataUrl = "https://onaci.github.io/leaflet-velocity/wind-global.json";


  return (
    <section id="map" className="py-16 px-6 bg-gradient-to-b from-[#1B263B] via-[#1B263B] to-[#0D1B2A]">
      <h3 className="text-3xl font-bold mb-8 text-center text-white">Tornado Risk Map</h3>
      <div className="flex justify-center">
        <MapContainer center={[39.8283, -98.5795]} zoom={4} scrollWheelZoom={true} className="h-[600px] w-full max-w-6xl rounded-lg shadow-xl border-2 border-blue-500/50">
          <LayersControl position="topright">
            <BaseLayer checked name="Dark Matter">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </BaseLayer>
            <BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>

            <Overlay name="Animated Wind (Flowy)" checked>
              <WindyVelocityLayer windDataUrl={windDataUrl} />
            </Overlay>
            <Overlay name="Radar">
              <TileLayer
                url={`https://tile.openweathermap.org/map/radar/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                opacity={0.7}
                attribution="OpenWeatherMap"
              />
            </Overlay>
            <Overlay name="Clouds">
              <TileLayer
                url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                opacity={0.6}
                attribution="OpenWeatherMap"
              />
            </Overlay>
            {/* Remove the old static Wind layer if using animated wind */}
            {/* <Overlay name="Wind (Static Tiles)">
              <TileLayer
                url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                opacity={0.6}
                attribution="OpenWeatherMap"
              />
            </Overlay> */}
            <Overlay name="Temperature">
              <TileLayer
                url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                opacity={0.6}
                attribution="OpenWeatherMap"
              />
            </Overlay>
            <Overlay name="Precipitation">
              <TileLayer
                url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
                opacity={0.6}
                attribution="OpenWeatherMap"
              />
            </Overlay>
          </LayersControl>
          {markerCoords && (
            <>
              <MapUpdater markerCoords={markerCoords} />
              <Marker position={markerCoords}>
                <Popup>
                  Prediction Location <br /> Lat: {markerCoords[0].toFixed(4)}, Lon: {markerCoords[1].toFixed(4)}
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </section>
  );
}

export default RiskMap;
