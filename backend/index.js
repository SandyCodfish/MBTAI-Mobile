const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// CORS – allow all origins so phones on the LAN can reach the backend.
// In production you would lock this down to specific origins.
// ---------------------------------------------------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------
const DATA_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ---------------------------------------------------------------------------
// Haversine distance (meters)
// ---------------------------------------------------------------------------
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Active-user filter
// Active  : updated within 30 s  (generous buffer for 5 s heartbeat)
// Closing : marked closing, keep for 10 s
// ---------------------------------------------------------------------------
const ACTIVE_TTL_MS  = 30 * 1000;
const CLOSING_TTL_MS = 10 * 1000;

function isUserVisible(u) {
  const now = Date.now();
  if (u.isActive === false && u.closingTime) {
    return now - new Date(u.closingTime).getTime() < CLOSING_TTL_MS;
  }
  return now - new Date(u.timestamp).getTime() < ACTIVE_TTL_MS;
}

// ---------------------------------------------------------------------------
// POST /api/update-location  – heartbeat / location update
// ---------------------------------------------------------------------------
app.post('/api/update-location', (req, res) => {
  const { id, mbtiType, latitude, longitude } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  let users = readUsers();
  const existing = users.find(u => u.id === id);
  users = users.filter(u => u.id !== id);

  users.push({
    id,
    mbtiType,
    latitude,
    longitude,
    ip,
    timestamp: new Date().toISOString(),
    isActive: true,
    interactions: existing?.interactions || {},
    matches: existing?.matches || [],
    currentMatch: existing?.currentMatch || null,
  });

  writeUsers(users);
  console.log(`[♥] ${id.slice(-6)} @ ${new Date().toLocaleTimeString()}`);
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// POST /api/nearby-users  – users within 100 m (excluding self)
// ---------------------------------------------------------------------------
app.post('/api/nearby-users', (req, res) => {
  const { id, latitude, longitude } = req.body;
  const users = readUsers();

  const visible = users.filter(isUserVisible);
  const nearby = visible.filter(u =>
    u.id !== id &&
    getDistanceMeters(latitude, longitude, u.latitude, u.longitude) <= 100
  );

  console.log(`[nearby] ${id.slice(-6)}: ${nearby.length}/${visible.length} visible`);
  res.json(nearby);
});

// ---------------------------------------------------------------------------
// GET /api/all-users
// ---------------------------------------------------------------------------
app.get('/api/all-users', (req, res) => {
  res.json(readUsers());
});

// ---------------------------------------------------------------------------
// GET /api/active-users
// ---------------------------------------------------------------------------
app.get('/api/active-users', (req, res) => {
  const users = readUsers().filter(isUserVisible);
  console.log(`[active-users] ${users.length} active`);
  res.json(users);
});

// ---------------------------------------------------------------------------
// GET /api/received-interactions/:userId
// ---------------------------------------------------------------------------
app.get('/api/received-interactions/:userId', (req, res) => {
  const { userId } = req.params;
  const users = readUsers();

  const received = [];
  users.forEach(u => {
    if (u.id === userId || !u.interactions) return;
    const key = `${u.id}-${userId}`;
    const interaction = u.interactions[key];
    if (interaction) {
      received.push({
        fromId: u.id,
        fromMbtiType: u.mbtiType,
        type: interaction.type,
        timestamp: interaction.timestamp,
      });
    }
  });

  res.json({ receivedInteractions: received });
});

// ---------------------------------------------------------------------------
// POST /api/send-interaction
// ---------------------------------------------------------------------------
app.post('/api/send-interaction', (req, res) => {
  const { fromId, toId, interactionType } = req.body;
  let users = readUsers();

  const fromIdx = users.findIndex(u => u.id === fromId);
  const toIdx   = users.findIndex(u => u.id === toId);

  if (fromIdx === -1 || toIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!users[fromIdx].interactions) users[fromIdx].interactions = {};
  if (!users[toIdx].interactions)   users[toIdx].interactions   = {};

  const key = `${fromId}-${toId}`;
  users[fromIdx].interactions[key] = {
    type: interactionType,
    timestamp: new Date().toISOString(),
    toId,
  };

  // Check for reciprocal interaction → create match
  const reciprocalKey = `${toId}-${fromId}`;
  const reciprocal = users[toIdx].interactions[reciprocalKey];
  let isMatch = false;

  if (reciprocal && reciprocal.type === interactionType) {
    isMatch = true;
    const matchId = `match-${Date.now()}`;
    const match = {
      id: matchId,
      users: [fromId, toId],
      timestamp: new Date().toISOString(),
      status: 'active',
    };
    users[fromIdx].matches = users[fromIdx].matches || [];
    users[toIdx].matches   = users[toIdx].matches   || [];
    users[fromIdx].matches.push(match);
    users[toIdx].matches.push(match);
    users[fromIdx].currentMatch = matchId;
    users[toIdx].currentMatch   = matchId;
    console.log(`[MATCH] ${fromId.slice(-6)} ↔ ${toId.slice(-6)} via ${interactionType}`);
  }

  writeUsers(users);
  console.log(`[interaction] ${fromId.slice(-6)} → ${toId.slice(-6)} (${interactionType})`);
  res.json({ status: 'sent', interactionType, isMatch });
});

// ---------------------------------------------------------------------------
// GET /api/current-match/:userId
// ---------------------------------------------------------------------------
app.get('/api/current-match/:userId', (req, res) => {
  const { userId } = req.params;
  const users = readUsers();
  const user = users.find(u => u.id === userId);

  if (!user || !user.currentMatch) return res.json({ hasMatch: false });

  const match = user.matches?.find(m => m.id === user.currentMatch);
  if (!match) return res.json({ hasMatch: false });

  const otherUserId = match.users.find(id => id !== userId);
  const otherUser   = users.find(u => u.id === otherUserId);
  if (!otherUser) return res.json({ hasMatch: false });

  const distance = getDistanceMeters(
    user.latitude, user.longitude,
    otherUser.latitude, otherUser.longitude
  );

  res.json({
    hasMatch: true,
    match: {
      ...match,
      otherUser: {
        id: otherUser.id,
        mbtiType: otherUser.mbtiType,
        latitude: otherUser.latitude,
        longitude: otherUser.longitude,
      },
      distance: Math.round(distance),
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/complete-meeting
// ---------------------------------------------------------------------------
app.post('/api/complete-meeting', (req, res) => {
  const { userId } = req.body;
  let users = readUsers();

  const uIdx = users.findIndex(u => u.id === userId);
  if (uIdx === -1 || !users[uIdx].currentMatch) {
    return res.status(404).json({ error: 'No active match found' });
  }

  const matchId = users[uIdx].currentMatch;
  const match   = users[uIdx].matches?.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const otherUserId = match.users.find(id => id !== userId);
  const oIdx        = users.findIndex(u => u.id === otherUserId);

  match.status      = 'completed';
  match.completedAt = new Date().toISOString();
  users[uIdx].currentMatch = null;
  if (oIdx !== -1) users[oIdx].currentMatch = null;

  writeUsers(users);
  console.log(`[met] ${userId.slice(-6)} ↔ ${otherUserId?.slice(-6)}`);
  res.json({ status: 'completed', matchId });
});

// ---------------------------------------------------------------------------
// POST /api/mark-closing  – sendBeacon from beforeunload / pagehide
// ---------------------------------------------------------------------------
app.post('/api/mark-closing', (req, res) => {
  const { id } = req.body;
  const users = readUsers();
  const uIdx = users.findIndex(u => u.id === id);
  if (uIdx !== -1) {
    users[uIdx].isActive    = false;
    users[uIdx].closingTime = new Date().toISOString();
    writeUsers(users);
    console.log(`[closing] ${id.slice(-6)}`);
  }
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// DELETE /api/remove-user
// ---------------------------------------------------------------------------
app.delete('/api/remove-user', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  let users = readUsers().filter(u => u.id !== id);
  writeUsers(users);
  console.log(`[removed] ${id.slice(-6)}`);
  res.json({ status: 'removed', id });
});

// ---------------------------------------------------------------------------
// Monitor / debug pages
// ---------------------------------------------------------------------------
app.get('/all-users', (req, res) => res.sendFile(path.join(__dirname, 'all-users.html')));
app.get('/monitor',   (req, res) => res.sendFile(path.join(__dirname, 'monitor.html')));
app.get('/simple',    (req, res) => res.sendFile(path.join(__dirname, 'simple.html')));

// ---------------------------------------------------------------------------
// Periodic cleanup – remove users that have been in "closing" state > 10 s
// ---------------------------------------------------------------------------
setInterval(() => {
  const users = readUsers();
  const before = users.length;
  const kept = users.filter(u => {
    if (u.isActive === false && u.closingTime) {
      return Date.now() - new Date(u.closingTime).getTime() < CLOSING_TTL_MS;
    }
    return true;
  });
  if (kept.length < before) {
    writeUsers(kept);
    console.log(`[cleanup] removed ${before - kept.length} stale users`);
  }
}, 15000); // run every 15 s (aligned with 5 s heartbeat cadence)

// ---------------------------------------------------------------------------
// Start – listen on ALL interfaces so LAN devices can reach the backend
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend listening on http://0.0.0.0:${PORT}`);
  console.log(`   Monitor: http://localhost:${PORT}/monitor\n`);
});
