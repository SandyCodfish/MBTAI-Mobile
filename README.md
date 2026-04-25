# MBTAI Demo

A Vite + React + TypeScript frontend with a simple Express backend to demo nearby matching and interactions (wave, smile, coffee).

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+

## Quick Start

1. Install dependencies

```
npm install
npm --prefix backend install
```

2. Run both frontend and backend together

```
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend API and HTML views: `http://localhost:3001`

## Useful URLs

- Default app: `http://localhost:5173`
- New user onboarding: `http://localhost:5173/?newuser`
- Backend monitor: `http://localhost:3001/monitor`
- Backend all users: `http://localhost:3001/all-users`
- Backend simple viewer: `http://localhost:3001/simple`

## Demo Flow (Two Users)

- Open two separate browser profiles (or one normal window + one Incognito)
- In each window, go to `http://localhost:5173/?newuser` and complete onboarding
- Allow location if prompted
- In Nearby, user A sends a Wave/Smile/Coffee to user B
- User B sends the same interaction back to user A
- A match is created and the matching interface opens

## Scripts

- `npm run dev` – Frontend only (Vite)
- `npm run dev:backend` – Backend only (Express)
- `npm run dev:all` – Frontend + Backend concurrently

## Notes

- If ports are in use, stop prior processes or change ports
- For fresh onboarding, append `?newuser` to the app URL
