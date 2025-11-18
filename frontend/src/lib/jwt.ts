// src/lib/jwt.ts
export function jwtDecode<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // add padding if needed
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as T;
  } catch (e) {
    console.warn('jwtDecode failed', e);
    return null;
  }
}
