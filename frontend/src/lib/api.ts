// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '../app/store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qm_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // Use simple localStorage removal; don't import store here (circular)
      localStorage.removeItem('qm_token');
      // Reload to force react-router to pick login route (or let app handle)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
