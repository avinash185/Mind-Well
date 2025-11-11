# Server (Node.js + Express)

## Setup
- `npm install`

## Environment
Create `./.env` and set:
- `MONGODB_URI=<your mongodb uri>`
- `JWT_SECRET=<your secret>`
- other variables as needed

## Run (Development)
- Ensure `PORT=5052` in `.env` (matches Vite proxy)
- Windows PowerShell:
  - `npm run dev`
- macOS/Linux:
  - `npm run dev`

## Health Check
- `http://localhost:5052/api/health`
  - Returns `{ dbConnected: true/false, dbState: 0-3 }`

## Scripts
- `npm run dev` – start with nodemon
- `npm start` – start production