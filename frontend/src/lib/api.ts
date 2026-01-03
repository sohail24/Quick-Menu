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
