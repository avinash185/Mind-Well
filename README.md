# MindWell – Agentic Mental Health Platform

MindWell is an Agentic AI system for mental well‑being support. It combines a React frontend, an Express/MongoDB API, and a Python (Flask) LLM agent to enable natural‑language interactions, guidance, and workflow automation (e.g., notifications), with a flexible architecture that can evolve toward more autonomous behaviors.

## Overview / Abstract
The system enables users to interact via chat, receive AI‑assisted guidance, and leverage backend services for authentication, data storage, and notifications. The Python agent uses a Google Generative AI model, while the Node.js API manages users, sessions, email, and data persistence.

## Core Capabilities
- Understand user requests via NLP and LLM chat.
- Maintain conversation state within the agent process.
- Expose REST endpoints for auth, data, and notifications.
- Send transactional emails (SendGrid) when configured.
- Proxy unified access through the frontend during development.

## System Architecture
- `client` — React + Vite app; proxies to backend services in dev.
- `server` — Node.js/Express API; MongoDB persistence, JWT auth, email.
- `python_backend` — Flask agent powered by Google Generative AI.

Dev proxy routing from `client`:
- `/api` → `http://localhost:5052`
- `/agent` → `http://localhost:5000` (path rewrite to backend root)

## Tech Stack
- Frontend: React, Vite
- Backend: Node.js, Express, Mongoose (MongoDB)
- Agent: Python, Flask, Google Generative AI
- AI/LLM: Gemini (configurable), OpenAI client available
- Email: SendGrid (optional)
- Tooling: Nodemon, Concurrently, Dotenv

## Agent Workflow
1) User submits a message from the React UI.
2) Frontend routes to `/agent` for LLM responses (Flask, Gemini model).
3) Backend `/api` endpoints handle auth, persistence, and notifications.
4) Responses render in the UI; actions can trigger emails or data updates.
5) Session data can be persisted via the Node API and MongoDB.

## Installation & Setup
Prerequisites:
- Node.js 18+
- Python 3.11+
- MongoDB running locally or a connection string in `server/.env`

Clone and install:
```
git clone <your-repo-url>
cd Venky
npm run install-all            # installs client and server deps
cd python_backend && pip install -r requirements.txt
```

Environment configuration:
- Create `server/.env` (see keys below). Default server port is `5052`.
- Create `python_backend/.env` with your Google API key and agent settings.

Run locally (three terminals recommended):
- Python Agent (Flask):
  - Windows PowerShell: ``$env:PY_AGENT_PORT="5000"; $env:ENABLE_NGROK="false"; python -u app.py``
  - macOS/Linux: ``PY_AGENT_PORT=5000 ENABLE_NGROK=false python -u app.py``
- Node API (Express):
  - From `server`: ``npm run dev`` → `http://localhost:5052`
- Frontend (Vite):
  - From `client`: ``npm run dev`` → `http://localhost:3000`

Alternatively, from repo root you can run client+server together:
```
npm run dev    # starts server (5052) and client (3000)
```

Health checks:
- Agent: `http://localhost:5000/health`
- API: `http://localhost:5052/api/health`
- Frontend: `http://localhost:3000/`

## Environment Variables
Server (`server/.env`):
```
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
PORT=5052
NODE_ENV=development
OPENAI_API_KEY=
GEMINI_API_KEY=
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-pro
CLIENT_URL=http://localhost:3000
MAIL_FROM=
MAIL_FROM_NAME=
SENDGRID_API_KEY=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Python Agent (`python_backend/.env`):
```
GOOGLE_API_KEY=
GENAI_MODEL_NAME=gemma-3-1b-it
PY_AGENT_PORT=5000
ENABLE_NGROK=false
NGROK_AUTH_TOKEN=
```

## Demo / Screenshots
- Add chat UI and workflow screenshots in `./screenshots/`.
- Optional: architecture diagram in `./docs/architecture.png`.

## How It Works (Internals)
- Planner/Orchestrator: UI and API coordinate what to call when.
- Reasoner: LLM (Gemini) interprets intent and maintains chat context.
- Executor: Express routes perform actions (auth, email, persistence).
- Memory: MongoDB stores application and user data; agent maintains short-term chat state.

## Use Cases
- Healthcare mental‑wellbeing assistant
- Counseling session triage and guidance
- Patient intake Q&A and resources navigation
- Customer support for wellness programs

## Challenges & Future Enhancements
Current:
- Stable dev proxying and health checks across services
- Basic LLM chat, auth, and email hooks

Future:
- Voice input/output and multilingual support
- Enhanced memory and retrieval for long‑term context
- Autonomous task planning and tool use across services
- Analytics dashboards and safety/guardrails

## Project Demo Link / Live Deployment
- Live Demo: TBD (add your deployed URL)

## Author / Contact
- Developed by MindWell Team
- Email: your-email@example.com
- LinkedIn: https://linkedin.com/in/your-profile

## License
MIT License © 2025 MindWell Team