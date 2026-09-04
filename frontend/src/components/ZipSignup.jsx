import { useState } from 'react';
import { api } from '../api/client';

function ZipSignup() {
  const [zipcode, setZipcode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!/^\d{5}(-\d{4})?$/.test(zipcode)) {
      setError('Enter a valid 5-digit US ZIP code.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.subscribe(zipcode, email);
      setSuccess(response.message || 'Subscription saved.');
    } catch (requestError) {
      setError(requestError.message || 'Subscription could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instrument-panel signup-panel">
      <div className="signup-copy">
        <p className="panel-label">Location-based monitoring</p>
        <h3>Weather intelligence in your inbox</h3>
        <p>
          Sentinel evaluates subscribed locations on a schedule. AeroCast experimental
          signals are separate from official emergency systems—always maintain official
          weather alerts on your devices.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          US ZIP code
          <input
            inputMode="numeric" autoComplete="postal-code" placeholder="77002"
            value={zipcode} onChange={(event) => setZipcode(event.target.value.trim())}
            disabled={loading}
          />
        </label>
        <label>
          Email address
          <input
            type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Saving subscription…' : 'Subscribe to Sentinel'}
        </button>
        {success && <p className="success-message" role="status">{success}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </form>
    </div>
  );
}

export default ZipSignup;
