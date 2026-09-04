function LiveAlert({ analysis, alerts, loading, error }) {
  const activeAlert = alerts?.[0];
  let className = 'official-status neutral';
  let content = 'No location selected — use the predictor to check current alerts.';

  if (loading) {
    content = 'Checking official National Weather Service alerts…';
  } else if (error) {
    className = 'official-status unavailable';
    content = `Official NWS alert status unavailable: ${error}`;
  } else if (analysis && activeAlert) {
    className = 'official-status severe';
    content = `Official NWS Alert — ${activeAlert.event}: ${activeAlert.headline || activeAlert.area}`;
  } else if (analysis && alerts) {
    className = 'official-status clear';
    content = 'No active official NWS alerts for this location.';
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <span className="official-kicker">Official NWS status</span>
      <span>{content}</span>
    </div>
  );
}

export default LiveAlert;
