const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError('AeroCastAI API is offline. Start the backend and try again.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = Array.isArray(payload?.detail)
      ? payload.detail.map((item) => item.msg).join(', ')
      : payload?.detail;
    throw new ApiError(detail || `Request failed with HTTP ${response.status}.`, response.status);
  }
  return payload;
}

const query = (params) => new URLSearchParams(params).toString();

export const api = {
  root: () => request('/'),
  health: () => request('/health'),
  systemStatus: () => request('/system/status'),
  recentAlertActivity: (limit = 25) => request(`/alerts/recent?${query({ limit })}`),
  predict: (latitude, longitude) => request('/predict', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  }),
  officialAlerts: (latitude, longitude) => request(
    `/official-alerts?${query({ latitude, longitude })}`,
  ),
  subscribe: (zipcode, email) => request('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ zipcode, email }),
  }),
};

export { API_BASE_URL };
