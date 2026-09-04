import { useState } from 'react';

const signals = [
  { id: 'temperature', label: 'Temperature', value: '2 m', x: 18, y: 26, detail: 'Current air temperature and apparent temperature' },
  { id: 'moisture', label: 'Moisture', value: 'RH + dew', x: 78, y: 22, detail: 'Relative humidity and dew-point relationship' },
  { id: 'pressure', label: 'Pressure', value: 'hPa', x: 86, y: 66, detail: 'Surface pressure within the local atmospheric field' },
  { id: 'wind', label: 'Wind', value: '10 m', x: 66, y: 82, detail: 'Wind speed and change from the previous hour' },
  { id: 'clouds', label: 'Cloud field', value: '3 layers', x: 29, y: 79, detail: 'Total and mid-level cloud cover plus precipitation' },
  { id: 'deltas', label: 'Hourly deltas', value: '3 signals', x: 10, y: 57, detail: 'Temperature, humidity, and wind change over one hour' },
];

function AI3DVisualization() {
  const [active, setActive] = useState(signals[0]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - bounds.top) / bounds.height - 0.5) * -4,
      y: ((event.clientX - bounds.left) / bounds.width - 0.5) * 5,
    });
  };

  return (
    <div className="atmospheric-console" onPointerMove={handlePointerMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="console-bar">
        <span><i /> LIVE FEATURE FIELD</span>
        <span>12 INPUTS · HOURLY ALIGNMENT</span>
      </div>
      <div className="signal-field" style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="radar-grid" />
        <div className="radar-ring ring-one" />
        <div className="radar-ring ring-two" />
        <div className="radar-ring ring-three" />
        <div className="radar-sweep" />
        <svg className="signal-links" viewBox="0 0 100 100" aria-hidden="true">
          {signals.map((signal) => <line key={signal.id} x1="50" y1="50" x2={signal.x} y2={signal.y} />)}
        </svg>
        <div className="model-core"><span>V3</span><strong>MODEL INPUT</strong><small>validated</small></div>
        {signals.map((signal) => (
          <button type="button" key={signal.id} className={`signal-node ${active.id === signal.id ? 'active' : ''}`}
            style={{ left: `${signal.x}%`, top: `${signal.y}%` }} onPointerEnter={() => setActive(signal)}
            onFocus={() => setActive(signal)} onClick={() => setActive(signal)}>
            <span>{signal.label}</span><small>{signal.value}</small>
          </button>
        ))}
      </div>
      <div className="signal-readout" aria-live="polite">
        <span>SELECTED SIGNAL</span><strong>{active.label}</strong><p>{active.detail}</p><b>Validated before inference</b>
      </div>
    </div>
  );
}

export default AI3DVisualization;
