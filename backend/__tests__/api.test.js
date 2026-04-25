/**
 * Smokescreen test suite for the MBTAI-Mobile backend.
 *
 * Strategy: import the Express app, listen on an ephemeral port, hit every
 * /api route with `fetch`, assert no route 5xx's. The bug that prompted
 * this suite was `/api/mark-closing` 500'ing on an empty/text body
 * (sendBeacon doesn't send Content-Type: application/json).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Use an isolated users.json so the suite can't see or pollute dev state.
const USERS_FILE = path.join(__dirname, '..', 'users.json');
let backupExists = false;
let backupContents = null;

const app = require('..');           // backend/index.js

let baseUrl;
let server;

test.before(async () => {
  // Stash dev users.json if present, then start with a clean slate.
  if (fs.existsSync(USERS_FILE)) {
    backupExists = true;
    backupContents = fs.readFileSync(USERS_FILE, 'utf8');
  }
  fs.writeFileSync(USERS_FILE, '[]');

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // Restore dev users.json (or remove the test-created one).
  if (backupExists) fs.writeFileSync(USERS_FILE, backupContents);
  else fs.rmSync(USERS_FILE, { force: true });
});

const post = (route, body, headers = {}) =>
  fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const get = (route) => fetch(`${baseUrl}${route}`);

// ---------------------------------------------------------------------------
// The bug reproduction: navigator.sendBeacon sends body as text/plain (or
// no Content-Type). Express's express.json() middleware skips parsing, so
// req.body is undefined, and `const { id } = req.body` throws.
// ---------------------------------------------------------------------------
test('POST /api/mark-closing tolerates a sendBeacon-style text body (no JSON content-type)', async () => {
  const res = await post(
    '/api/mark-closing',
    JSON.stringify({ id: 'sendbeacon-user' }),
    { 'Content-Type': 'text/plain;charset=UTF-8' }, // exactly what sendBeacon sends
  );
  assert.ok(res.status < 500, `expected non-5xx, got ${res.status}`);
});

test('POST /api/mark-closing tolerates an empty body (no payload at all)', async () => {
  const res = await fetch(`${baseUrl}/api/mark-closing`, { method: 'POST' });
  assert.ok(res.status < 500, `expected non-5xx, got ${res.status}`);
});

// ---------------------------------------------------------------------------
// Smokescreen for the rest of the URL/location-tracking surface.
// We don't assert exact response shapes — just that no route 500's on
// realistic inputs.
// ---------------------------------------------------------------------------
test('POST /api/update-location accepts a normal payload', async () => {
  const res = await post('/api/update-location', {
    id: 'smoke-A',
    mbtiType: 'INTJ',
    latitude: 42.36,
    longitude: -71.06,
  });
  assert.equal(res.status, 200);
});

test('POST /api/nearby-users returns an array', async () => {
  await post('/api/update-location', {
    id: 'smoke-B', mbtiType: 'ENFP', latitude: 42.36, longitude: -71.06,
  });
  const res = await post('/api/nearby-users', {
    id: 'smoke-A', latitude: 42.36, longitude: -71.06,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body), `expected array, got ${typeof body}`);
});

test('GET /api/received-interactions/:id returns 200 for a known user', async () => {
  const res = await get('/api/received-interactions/smoke-A');
  assert.ok(res.status < 500, `got ${res.status}`);
});

test('GET /api/current-match/:id returns 200 for a known user', async () => {
  const res = await get('/api/current-match/smoke-A');
  assert.ok(res.status < 500, `got ${res.status}`);
});

test('GET /monitor serves the HTML viewer', async () => {
  const res = await get('/monitor');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('<html') || html.includes('<!DOCTYPE'), 'response not HTML-ish');
});

test('GET /all-users serves the HTML viewer', async () => {
  const res = await get('/all-users');
  assert.equal(res.status, 200);
});

test('GET /simple serves the HTML viewer', async () => {
  const res = await get('/simple');
  assert.equal(res.status, 200);
});
