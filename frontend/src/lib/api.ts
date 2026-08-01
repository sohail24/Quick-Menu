// src/lib/api.ts
import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const baseURL = rawBaseURL.replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout? optional
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qm_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach X-Order-Token automatically for order-specific calls
  if (config.url && config.headers) {
    const match = config.url.match(/(?:\/orders\/|api\/[^\/]+\/orders\/)([a-f0-9\-]{36})/i);
    if (match && match[1]) {
      const orderId = match[1];
      try {
        const raw = localStorage.getItem('qm_order_tokens');
        if (raw) {
          const map = JSON.parse(raw);
          const orderToken = map[orderId];
          if (orderToken) {
            config.headers['X-Order-Token'] = orderToken;
          }
        }
      } catch {}
    }
  }

  return config;
});

// Response interceptor: DO NOT auto-redirect on 401.
// Instead, clear token locally and allow callers to handle the error.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // remove token to avoid repeated invalid auth headers
      localStorage.removeItem('qm_token');
      // dispatch an event that other parts of the app may listen to if desired
      try {
        window.dispatchEvent(new CustomEvent('qm:unauthorized', { detail: { status } }));
      } catch {}
      // Important: do NOT navigate here. Let caller handle.
    }
    return Promise.reject(error);
  },
);

export default api;
