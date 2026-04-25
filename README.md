# MBTAI Mobile

Live-location MBTI matching demo, designed so phones can join the demo from a real URL — not just `localhost` on the same wifi.

This is the merged & cleaned-up version of three feature branches from the original [SandyCodfish/MBTAI](https://github.com/SandyCodfish/MBTAI) repo:

| Source branch | What it contributed |
|---|---|
| `claude/mobile-demo-setup-l1DFW` | Auto-detected API URL, Safari-friendly geolocation, 5 s heartbeat, LAN listening |
| `feature/expose-frontend` | Vite `host: true` so other devices on the wifi can reach the dev server |
| `china-tunnel-fix` | HTTPS support so geolocation works on non-localhost origins |

The new repo additionally:
- collapses everything to a **single port** via a Vite `/api` proxy so one tunnel exposes the whole demo
- ships a **mkcert** helper script instead of committing TLS private keys
- documents both **cloudflared** and **ngrok** tunnels

---

## Where the URL / location-tracking code lives

If you only want to read the parts that turn this from "localhost demo" into "phones on a real URL":

### Frontend
- **`src/config.ts`** — API base URL. Returns `''` so `fetch('/api/...')` is same-origin. The Vite proxy below routes it.
- **`vite.config.ts`** — `server.host: true` (LAN exposure), `server.https` (opt-in via `MBTAI_HTTPS=1`), `server.proxy['/api']` → `localhost:3001`. **This is the file that bridges localhost → public URL.**
- **`src/App.tsx`** — `navigator.geolocation.getCurrentPosition` capture, permission probing, 5 s heartbeat that POSTs `/api/update-location`, polling for `/api/nearby-users`, `/api/received-interactions/:id`, `/api/current-match/:id`.
- **`src/components/NearbyMatches.tsx`** — POSTs `/api/send-interaction`, polls `/api/current-match/:id`.
- **`src/components/MatchingInterface.tsx`** — polls `/api/current-match/:id`, POSTs `/api/complete-meeting`.

### Backend
- **`backend/index.js`** — Express app. Listens on `0.0.0.0:3001` so the Vite proxy can reach it. Implements:
  - `POST /api/update-location` — store `{id, mbtiType, latitude, longitude, timestamp}`
  - `POST /api/nearby-users` — Haversine within 100 m
  - `POST /api/send-interaction`, `POST /api/mark-closing`, `POST /api/complete-meeting`
  - `GET /api/received-interactions/:id`, `GET /api/current-match/:id`
  - Server-rendered viewer pages `/monitor`, `/all-users`, `/simple`
- **`backend/monitor.html`**, **`backend/all-users.html`**, **`backend/simple.html`** — live viewers of who is where.

### Tooling
- **`scripts/setup-https.sh`** — mkcert helper that writes `certs/cert.pem` and `certs/key.pem` for `localhost`, `127.0.0.1`, and your detected LAN IP.

---

## Quickstart

### 1. Install
```bash
npm install
npm --prefix backend install
```

### 2. Run (HTTP, single port via Vite proxy)
```bash
npm run dev:all
```
- App: http://localhost:5173
- Monitor: http://localhost:3001/monitor
- Same wifi (HTTP): http://YOUR-LAPTOP-IP:5173 — works as a *map view* but **the browser will block geolocation on non-HTTPS non-localhost origins**. For phones on LAN, use the HTTPS variant below.

### 3. Phones on same wifi (HTTPS, geolocation works)
```bash
brew install mkcert nss   # one-time
npm run setup:https       # generates certs/cert.pem + key.pem
npm run dev:https         # starts everything with TLS on 5173
```
On the phone, open `https://YOUR-LAPTOP-IP:5173` and trust the cert (iOS: Settings → General → About → Certificate Trust Settings → enable mkcert root).

### 4. Phones outside your wifi (real URL via tunnel)
Pick one. The tunnel terminates TLS for you, so you don't need mkcert in this mode.

**Cloudflare Tunnel (no signup, free):**
```bash
brew install cloudflared
npm run dev:all                 # in one terminal
npm run tunnel:cloudflared      # in another — prints a https://*.trycloudflare.com URL
```

**ngrok (free tier needs signup):**
```bash
brew install ngrok
ngrok config add-authtoken <YOUR_TOKEN>
npm run dev:all
npm run tunnel:ngrok            # prints a https://*.ngrok-free.app URL
```

Open the printed URL on the phone — geolocation just works, and the `/api` proxy means one tunnel covers everything.

---

## Demo flow

### Multi-persona in a single browser (best for live demos)

Each tab gets its own persisted persona via the `?user=<slot>` query param. Opening `…/?user=A` and `…/?user=B` in two tabs of the same browser gives you two independent users with isolated localStorage and onboarding state.

1. Tab 1: `https://<your-tunnel>/?user=A` → onboard once → User A persists in this slot forever.
2. Tab 2: `https://<your-tunnel>/?user=B` → onboard once → User B persists.
3. (Optional) Tab 3: `https://<your-tunnel>/?user=C` → User C. Repeat for as many personas as you need.
4. Allow location in each tab.
5. In *Nearby*, A sends Wave / Smile / Coffee to B.
6. B sends the same back → match opens on both.

Slot data is keyed by `mbti-user-<slot>` in localStorage and survives tab close, browser restart, and iOS tab reaping. To force a fresh onboarding for a specific slot, append `&newuser`: e.g. `https://<your-tunnel>/?user=A&newuser`. The flag self-cleans from the URL after consumption so a reload won't keep wiping you.

### Two devices (alternative)

Open `https://<your-tunnel>/` (no `?user`) on each device. Each device's `default` slot persists independently. First visit will onboard automatically because there's no saved user.

---

## Notes & gotchas

- **Don't commit `certs/`.** They're in `.gitignore`. The original `china-tunnel-fix` branch committed `localhost+2*.pem` — those were *private keys*. Public repo, never again.
- **`backend/users.json`** is runtime data, also gitignored.
- **CORS** is wide open (`origin: '*'`) for demo simplicity — lock down before any non-demo deploy.
- **China access (no VPN):** use the **cloudflared** tunnel (`npm run tunnel:cloudflared`). `*.trycloudflare.com` URLs reach mainland China without a VPN in our testing. **Avoid ngrok** — `*.ngrok-free.app` is frequently blocked by the GFW. If a specific Cloudflare subdomain ever stops resolving, just restart the tunnel — Cloudflare assigns a new random subdomain each time.
- **Cross-browser:** tested on iOS Safari, iOS Chrome (WKWebView), Android Chrome, desktop Safari, desktop Chrome. The geolocation flow uses the Permissions API where available and falls back to `'unknown'` on Safari < 16. If a user denies location and later re-grants it in OS Settings, the page **auto-recovers** when the tab regains focus (no manual refresh needed) — see the `visibilitychange`/`focus` listener in `src/App.tsx`.
- **Express 5** — `backend/package.json` pins to `^5.1.0`; some older middleware may complain.

---

## License

MIT.
