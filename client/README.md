# Client (React + Vite)

## Setup
- `npm install`

## Run (Development)
- `npm run dev`
- Open `http://localhost:3000/`

## Proxy
- `/api` → `http://localhost:3001`
- `/agent` → `http://localhost:5000` (with path rewrite)

## Useful URLs
- Agent health via proxy: `http://localhost:3000/agent/health`
- API health via proxy: `http://localhost:3000/api/health`

## Build
- `npm run build`
- Preview build: `npm run preview`