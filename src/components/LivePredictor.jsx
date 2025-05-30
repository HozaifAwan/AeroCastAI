import React, { useState } from "react";

// Simple animated "thinking" icon (SVG)
const ThinkingIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="animate-pulse inline-block mr-2"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="3 3"
      opacity="0.8"
    />
    <path
      d="M12 7V8M12 16V17M17 12H16M8 12H7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

// Icon for AI commentary/message
const AICommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 inline-block mr-2 text-sky-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 15.75H8.25v-1.5L12 11.25l3.75 3V15.75Z"
    />
  </svg>
);

function LivePredictor({ setMarkerCoords }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(
    "Enter coordinates to get a live tornado risk assessment from AeroCastAI."
  );

  const handlePredict = async () => {
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude.");
      setAiMessage(
        "AeroCastAI needs valid coordinates to begin analysis. Please check your input."
      );
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);
    setAiMessage(
      "AeroCastAI is analyzing the latest atmospheric conditions for your selected location..."
    );

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      setIsLoading(false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: "Prediction request failed due to a server issue.",
        }));
        throw new Error(errorData.detail || "Prediction failed.");
      }

      const data = await response.json();
      setResult(data);

      if (data.prediction === 1) {
        setAiMessage(
          `AeroCastAI analysis complete: A potential tornado risk (Confidence: ${data.confidence}%) has been identified for ${
            data.location_name || "the selected area"
          }. Please monitor local alerts and stay safe.`
        );
      } else {
        setAiMessage(
          `AeroCastAI analysis complete: Current conditions appear stable (Confidence: ${data.confidence}%) in ${
            data.location_name || "the selected area"
          }. No immediate tornado risk detected by the AI.`
        );
      }

      if (setMarkerCoords && data.latitude && data.longitude) {
        setMarkerCoords([
          parseFloat(data.latitude),
          parseFloat(data.longitude),
        ]);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Failed to fetch prediction.");
      setAiMessage(
        "AeroCastAI encountered an issue while analyzing. Please check your input or try again shortly."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-b from-[#0D1B2A] to-[#0b1c2c] text-white px-4">
      <div className="bg-[#152a3d] p-8 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
          Live Tornado Predictor
        </h2>

        {/* AI Message Area - Moved to top */}
        <div
          className={`mb-6 p-4 rounded-lg text-sm transition-all duration-300 ${
            isLoading
              ? "bg-slate-700 animate-pulse"
              : result && result.prediction === 1
              ? "bg-red-800/60 border border-red-600"
              : result
              ? "bg-sky-800/60 border border-sky-600"
              : "bg-slate-700/80 border border-slate-600"
          }`}
        >
          <div className="flex items-center">
            <AICommentIcon />
            <p className="font-semibold">AeroCastAI:</p>
          </div>
          <p className="mt-1 ml-8">{aiMessage}</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Enter Latitude (e.g., 34.0522)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="p-3 w-full rounded bg-[#0d1d2b] border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none placeholder-slate-500"
            disabled={isLoading}
          />
          <input
            type="text"
            placeholder="Enter Longitude (e.g., -118.2437)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="p-3 w-full rounded bg-[#0d1d2b] border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none placeholder-slate-500"
            disabled={isLoading}
          />
        </div>

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          className="bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-lg w-full transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ThinkingIcon />
              Analyzing Conditions...
            </>
          ) : (
            "Predict Tornado Risk"
          )}
        </button>

        {/* Error Message */}
        {error &&
          !aiMessage.includes("encountered an issue") &&
          !aiMessage.includes("needs valid coordinates") && (
            <p className="text-red-400 mt-4 text-center">{error}</p>
          )}

        {/* Result Output */}
        {result && !isLoading && (
          <div className="mt-8 bg-[#0d1d2b] p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-200">
              Prediction Analysis
            </h3>
            {result.location_name && (
              <p className="mb-1">
                <strong>Place:</strong> {result.location_name}
              </p>
            )}
            <p className="mb-1">
              <strong>Coordinates:</strong>{" "}
              {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
            </p>
            <p className="mb-1">
              <strong>Analysis Time:</strong>{" "}
              {new Date(result.timestamp).toLocaleString()}
            </p>
            <p
              className={`mb-2 font-bold ${
                result.prediction === 1
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              <strong>Risk Assessment:</strong>{" "}
              {result.prediction === 1
                ? `🌪️ Potential Risk Detected (Confidence: ${result.confidence}%)`
                : `✅ No Immediate Risk Detected (Confidence: ${result.confidence}%)`}
            </p>
            <details className="mt-3 text-sm text-slate-300">
              <summary className="cursor-pointer hover:text-sky-300 transition-colors">
                View Weather Conditions Used in Analysis
              </summary>
              <div className="mt-2 pt-3 border-t border-slate-700 space-y-1">
                <p>
                  <strong>Temperature:</strong> {result.temperature_2m}°C
                </p>
                <p>
                  <strong>Dew Point:</strong> {result.dew_point_2m}°C
                </p>
                <p>
                  <strong>Humidity:</strong> {result.relative_humidity_2m}%
                </p>
                <p>
                  <strong>Pressure:</strong> {result.surface_pressure} hPa
                </p>
                <p>
                  <strong>Wind Speed:</strong> {result.wind_speed_10m} m/s
                </p>
                <p>
                  <strong>Cloud Cover:</strong> {result.cloud_cover}%
                </p>
                <p>
                  <strong>Precipitation:</strong> {result.precipitation} mm
                </p>
                <p>
                  <strong>Apparent Temp:</strong> {result.apparent_temperature}°C
                </p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default LivePredictor;

