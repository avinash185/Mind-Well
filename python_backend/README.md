# Python Backend (Flask Agent)

## Setup
Optional virtual environment is recommended.

### Create and activate venv
- Windows PowerShell:
  - `python -m venv venv`
  - `./venv/Scripts/Activate.ps1`
- macOS/Linux:
  - `python -m venv venv`
  - `source venv/bin/activate`

### Install dependencies
- `pip install -r requirements.txt`

## Run
- Windows PowerShell:
  - `$env:PY_AGENT_PORT="5000"; $env:ENABLE_NGROK="false"; python -u app.py`
- macOS/Linux:
  - `PY_AGENT_PORT=5000 ENABLE_NGROK=false python -u app.py`

## Health Check
- `http://localhost:5000/health`

## Notes
- The frontend proxies `/agent/*` to this service.
- Adjust `.env` as needed; `ENABLE_NGROK` can be toggled.