import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ZipSignup() {
  const [zipcode, setZipcode] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [markerPos, setMarkerPos] = useState([39.8283, -98.5795]); // Default: center of US
  const [mapLoading, setMapLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Send data to backend
    const res = await fetch("http://localhost:8000/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zipcode, email }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      alert("Signup failed!");
    }
  };

  const handleShowMap = async () => {
    if (!zipcode) return;
    setMapLoading(true);
    try {
      const resp = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
      if (!resp.ok) throw new Error("ZIP not found");
      const data = await resp.json();
      const lat = parseFloat(data.places[0].latitude);
      const lon = parseFloat(data.places[0].longitude);
      setMarkerPos([lat, lon]);
      setShowMap(true);
    } catch {
      alert("Could not find that ZIP code.");
    }
    setMapLoading(false);
  };

  const signupSteps = [
    {
      title: "Sign Up",
      description:
        "Enter your ZIP code and email to start receiving tornado alerts tailored to your location.",
      svg: (
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.1, 1] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#38bdf8"
            strokeWidth="4"
            fill="none"
          />
          <motion.path
            d="M16 24l6 6 10-10"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </motion.svg>
      ),
    },
    {
      title: "AI Monitors Weather",
      description:
        "Our AI continuously analyzes live weather data for your area, looking for tornado risk patterns.",
      svg: (
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#fbbf24"
            strokeWidth="4"
            fill="none"
          />
          <motion.path
            d="M24 8a16 16 0 1 1-11.31 4.69"
            stroke="#fbbf24"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.circle
            cx="24"
            cy="24"
            r="6"
            fill="#fbbf24"
            initial={{ scale: 0.7 }}
            animate={{ scale: [0.7, 1, 0.7] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </motion.svg>
      ),
    },
    {
      title: "Get Alerted Instantly",
      description:
        "If a tornado threat is detected, you’ll receive an urgent email with risk level and safety instructions.",
      svg: (
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={{ y: 0 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <rect
            x="8"
            y="16"
            width="32"
            height="20"
            rx="4"
            fill="#38bdf8"
          />
          <motion.polygon
            points="8,16 24,32 40,16"
            fill="#0e172a"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <rect x="14" y="22" width="20" height="4" rx="2" fill="#bae6fd" />
        </motion.svg>
      ),
    },
  ];

  if (submitted) {
    return (
      <div className="bg-[#1a2233] rounded-lg shadow-lg p-6 mt-6 text-center max-w-xs mx-auto">
        <div className="text-sky-400 font-semibold text-lg mb-2">
          Thank you for signing up!
        </div>
        <div className="text-gray-300 text-sm">
          We’ll keep watch — you’ll be the first to know.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2233] rounded-lg shadow-lg p-6 mt-6 max-w-xs md:max-w-2xl mx-auto">
      {/* Animated Explainer Steps in a row on md+ screens */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-stretch">
        {signupSteps.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: idx * 0.15 }}
            viewport={{ once: true }}
            className="flex flex-col items-center bg-[#232b3e] rounded-lg p-3 shadow flex-1 min-w-[180px]"
          >
            {step.svg}
            <div className="mt-2 text-sky-300 font-semibold">{step.title}</div>
            <div className="text-gray-300 text-xs text-center">
              {step.description}
            </div>
          </motion.div>
        ))}
      </div>
      <h2 className="text-sky-400 font-bold text-lg mb-2 text-center">
        Get Tornado Alerts
      </h2>
      <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 rounded text-xs">
        <strong>
          Sign up to receive real-time tornado alerts for your area.
        </strong>
        <br />
        By subscribing, you will be notified by email if AeroCastAI predicts
        tornado activity near your location. Our system continuously monitors
        weather conditions, and if a potential tornado is detected, you will
        receive an urgent email alert advising you to seek shelter and stay safe.
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter your ZIP code"
          value={zipcode}
          onChange={(e) => setZipcode(e.target.value)}
          required
          className="p-2 rounded bg-[#232b3e] text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <input
          type="email"
          placeholder="Email (required for alerts)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-2 rounded bg-[#232b3e] text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        {/* ZIP Map Preview */}
        {showMap && (
          <div className="my-4">
            <MapContainer
              center={markerPos}
              zoom={11}
              scrollWheelZoom={false}
              style={{ height: "220px", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker markerPos={markerPos} setMarkerPos={setMarkerPos} />
            </MapContainer>
            <div className="text-xs text-gray-400 mt-1 text-center">
              Drag the pin if your location is slightly different.
            </div>
          </div>
        )}

        {/* Show/Hide Map Button */}
        <button
          type="button"
          onClick={handleShowMap}
          className="bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1 rounded mb-2"
          disabled={mapLoading || !zipcode}
        >
          {mapLoading ? "Loading..." : showMap ? "Update Map" : "Show on Map"}
        </button>

        {/* Hidden lat/lon fields for form submission */}
        <input type="hidden" name="latitude" value={markerPos[0]} />
        <input type="hidden" name="longitude" value={markerPos[1]} />

        <button
          type="submit"
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded transition"
        >
          Sign Up
        </button>
      </form>
      <div className="text-xs text-gray-400 mt-2 text-center">
        Enter your ZIP code and email to get alerted real time if in danger of a
        tornado.
      </div>
    </div>
  );
}

// Draggable marker component
function DraggableMarker({ markerPos, setMarkerPos }) {
  const [position, setPosition] = useState(markerPos);

  useMapEvents({
    dragend(e) {
      setMarkerPos([e.target.getLatLng().lat, e.target.getLatLng().lng]);
    },
  });

  return (
    <Marker
      position={markerPos}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setMarkerPos([latlng.lat, latlng.lng]);
        },
      }}
    />
  );
}

export default ZipSignup;