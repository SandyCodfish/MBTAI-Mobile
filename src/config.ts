/**
 * Auto-detect API URL based on where the frontend is served from.
 * - localhost → http://localhost:3001
 * - LAN IP (e.g. 192.168.1.5) → http://192.168.1.5:3001
 * This allows phones on the same network to hit the backend
 * without any manual config changes.
 */
const getApiUrl = (): string => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // Same host, backend port 3001
  return `http://${host}:3001`;
};

export const API_URL = getApiUrl();
