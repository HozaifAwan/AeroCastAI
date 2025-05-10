import { useState } from 'react';

function LivePredictor() {
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!location.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch("https://aerocastai-backend.onrender.com/user-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-[#0D1B2A] text-white">
      <div className="max-w-xl mx-auto bg-[#1B263B] p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Live Tornado Risk Predictor</h2>
        <input
          type="text"
          placeholder="e.g. Houston, Texas"
          className="w-full mb-4 px-4 py-2 rounded text-black"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {result && (
          <div className="mt-6 text-sm space-y-2">
            <h3 className="text-lg font-bold">📍 {result.location}</h3>
            <ul className="grid grid-cols-2 gap-2 text-gray-300">
              {Object.entries(result).map(([key, value]) => (
                key !== "location" && (
                  <li key={key}>
                    <strong>{key.replace(/_/g, " ")}:</strong> {value}
                  </li>
                )
              ))}
            </ul>
            <p className="mt-4 text-lg font-bold">
              {result.prediction === 1 ? (
                <span className="text-red-500">⚠️ Tornado Risk — {result.confidence}%</span>
              ) : (
                <span className="text-green-400">✅ No Risk — {result.confidence}%</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LivePredictor;
