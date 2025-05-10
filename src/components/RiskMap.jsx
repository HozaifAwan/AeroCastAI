import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function RiskMap() {
  return (
    <section id="map" className="py-16 px-6 bg-gradient-to-b from-[#1B263B] via-[#1B263B] to-[#0D1B2A]">
      <h3 className="text-3xl font-bold mb-8 text-center">Tornado Risk Map</h3>
      <div className="flex justify-center">
        <MapContainer center={[39.8283, -98.5795]} zoom={4} scrollWheelZoom={true} className="h-[500px] w-full max-w-5xl rounded-lg shadow-lg">
          <TileLayer
            attribution='&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    </section>
  );
}

export default RiskMap;
