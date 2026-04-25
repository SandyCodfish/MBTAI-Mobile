/**
 * API base URL.
 *
 * Empty string = same-origin / relative URL. All `/api/*` requests are
 * proxied to the backend by Vite (see vite.config.ts -> server.proxy).
 *
 * Why relative? It collapses frontend + backend behind a single port,
 * which means a single tunnel (cloudflared / ngrok) exposes the whole
 * demo to phones outside your wifi without mixed-content errors.
 */
export const API_URL = '';
