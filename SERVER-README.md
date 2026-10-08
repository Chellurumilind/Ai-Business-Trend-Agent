# Server Setup and Operations Guide

This guide explains how to run the AI Business Trend Agent services together: PostgreSQL, the FastAPI backend, the React frontend, and the optional n8n automation server.

## Service overview

| Service | Purpose | Default address | Required |
| --- | --- | --- | --- |
| PostgreSQL | Stores financial transactions | `localhost:5432` | Yes |
| FastAPI backend | Provides the REST API, analytics, and AI integration | `http://localhost:8000` | Yes |
| React frontend | Provides the browser dashboard | `http://localhost:5173` | Yes |
| n8n | Schedules health checks and Telegram notifications | `http://localhost:5678` | Optional |
| Telegram Bot API | Delivers messages from n8n | Managed by Telegram | Optional |

## How services connect

```mermaid
flowchart LR
    Browser["Browser"] -->|"http://localhost:5173"| Frontend["React / Vite"]
    Frontend -->|"http://localhost:8000/api/v1"| Backend["FastAPI"]
    Backend -->|"DATABASE_URL"| Database[("PostgreSQL :5432")]
    Backend -->|"AI provider key"| AI["OpenAI or Gemini"]
    N8N["n8n :5678"] -->|"GET /api/v1/analytics/summary"| Backend
    N8N --> Telegram["Telegram Bot API"]
```

## Before you start

Install the following on the machine that will run the services:

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL 15 or newer
- n8n only if scheduled notifications are needed
- An OpenAI or Gemini API key only if AI Insights are needed

Use separate terminals for the backend, frontend, and n8n processes during local development.

## 1. PostgreSQL server

### Create the database

Start PostgreSQL, sign in as a database administrator, and create the application database:

```sql
CREATE DATABASE business_trend_db;
```

Create a dedicated database user for non-development use and grant it access to this database. Do not use the PostgreSQL superuser in production.

### Connection string

The backend reads its database connection from `backend/.env`:

```env
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@localhost:5432/business_trend_db
```

If PostgreSQL is on another machine, replace `localhost` with that server's private hostname or IP address. Ensure the database permits the backend host to connect and that port `5432` is protected by a firewall.

### Apply the schema

From the `backend` directory, run:

```powershell
alembic upgrade head
```

This creates the `transactions` table and its indexes. Run the migration whenever a newer application version includes a migration.

## 2. Backend server (FastAPI)

### Configuration

Create `backend/.env` from the provided template:

```powershell
cd backend
Copy-Item .env.example .env
```

Set the required values:

```env
# Application
APP_NAME=AI Business Trend Agent
APP_VERSION=1.0.0
DEBUG=true

# PostgreSQL
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@localhost:5432/business_trend_db

# AI Insights: choose openai or gemini
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=
```

Only one AI key is needed, according to `AI_PROVIDER`. Leave the unused provider key empty. The dashboard and transaction APIs work without an AI key; only the AI Insights endpoint requires one.

### Install and run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

For local development, the backend listens at:

- API root: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

### Backend health check

Open <http://localhost:8000> or run:

```powershell
Invoke-RestMethod http://localhost:8000
```

Expected fields include `status`, `app`, `version`, and `docs`.

### Exposing the backend to other services

The supplied configuration permits browser requests only from `http://localhost:5173`. If the frontend is hosted elsewhere, add its exact origin to the CORS list in `backend/app/main.py`.

To make FastAPI reachable from a different machine on your private network, use `--host 0.0.0.0` and allow port `8000` through the server firewall. Do this only behind a trusted network, reverse proxy, or VPN; this API has no authentication layer by default.

## 3. Frontend server (React + Vite)

### Install and run locally

```powershell
cd frontend
npm install
npm run dev
```

Vite normally starts at <http://localhost:5173>. The terminal prints the actual address if the port is changed because it is already in use.

### API target

The current frontend API client is configured with this fixed development target:

```text
http://localhost:8000/api/v1
```

It is defined in `frontend/src/api/client.js`. This means the browser must be able to reach the FastAPI server at port `8000` on the same machine. For a separately hosted backend, update that URL and update backend CORS settings to match the frontend's public origin.

### Production build

Create a static production bundle with:

```powershell
cd frontend
npm run build
```

The generated files are placed in `frontend/dist`. Serve that directory with a static web server or reverse proxy. Before publishing it, change the API base URL in `frontend/src/api/client.js` from the local development address to the HTTPS address of the deployed API, then rebuild.

## 4. n8n automation server

n8n is optional. Use it to run a scheduled ROI check and send Telegram updates.

### Install and start

```powershell
npm install -g n8n
n8n start
```

Open <http://localhost:5678> and create the local n8n owner account on first launch.

### Import the workflows

1. In n8n, create a workflow and use **Import from File**.
2. Import `n8n/Daily Business Health Check.json` or `n8n/Weekly Business Summary.json`.
3. Open the HTTP Request node and confirm its backend URL is reachable from n8n.
4. Open the Telegram node and create a Telegram credential with the bot token.
5. Replace any included sample chat ID with the intended recipient's chat ID.
6. Test the workflow manually, then activate it.

### n8n-to-backend address

The imported workflows use:

```text
http://127.0.0.1:8000/api/v1/analytics/summary
```

This works when n8n and FastAPI run directly on the same computer. If n8n runs in a container, `127.0.0.1` means the container itself, not the host. Change the request URL to a host-reachable address, such as a shared container service name or private network host.

### Workflow settings to review

Review every imported workflow before activation:

- **Schedule**: the daily workflow export currently contains a scheduled hour of `11`; adjust it to the desired timezone and time.
- **ROI threshold**: the daily workflow condition currently compares ROI with `20`, even though its label references 10%. Set both the condition and label to your chosen threshold.
- **Telegram chat ID**: set the actual recipient or group chat ID.
- **Telegram credential**: create your own credential; do not rely on any imported credential reference.
- **Dashboard link**: replace localhost links in messages with the public dashboard URL if recipients need to open it from their phones.

## Start order for local development

Start services in this order:

1. PostgreSQL
2. FastAPI backend
3. React frontend
4. n8n, if you are using automation

Use the following checks after startup:

| Check | Expected result |
| --- | --- |
| `http://localhost:8000` | JSON health response |
| `http://localhost:8000/docs` | FastAPI documentation page |
| `http://localhost:5173` | Business dashboard loads |
| `http://localhost:5678` | n8n interface loads, if started |
| `GET /api/v1/analytics/summary` | Analytics JSON response |

## Production deployment checklist

- Use a managed PostgreSQL server or a separately secured PostgreSQL instance.
- Store database passwords, API keys, bot tokens, and chat IDs in a secret manager or protected environment variables.
- Set `DEBUG=false`.
- Serve the frontend and API behind HTTPS.
- Put FastAPI behind a reverse proxy such as Nginx, Caddy, or a platform load balancer.
- Run FastAPI with a production process manager or service supervisor rather than `--reload`.
- Set explicit, minimal CORS origins; do not use wildcard origins with credentials.
- Add authentication and authorization before exposing transaction or insight endpoints to the internet.
- Restrict database access to the backend service and restrict n8n administrative access.
- Back up the PostgreSQL database and export n8n workflows on a schedule.
- Configure monitoring, logs, and alerts for failed API, database, and n8n workflow runs.

## Common server issues

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Backend exits immediately | Missing or invalid `.env` | Confirm `DATABASE_URL` exists and points to PostgreSQL. |
| `alembic upgrade head` fails | Database cannot be reached | Start PostgreSQL; verify port, user, password, and database name. |
| Frontend has a network error | Backend is stopped or uses a different port | Start FastAPI on port `8000` or update the frontend API client. |
| Browser shows a CORS error | Frontend origin is not permitted | Add the deployed frontend origin to FastAPI CORS configuration. |
| AI Insights returns an error | Wrong provider or unavailable API key | Set `AI_PROVIDER` to `openai` or `gemini` and supply the matching key. |
| n8n request is refused | n8n cannot reach `127.0.0.1:8000` | Use a network-reachable FastAPI address; containerized n8n needs a non-loopback address. |
| Telegram node fails | Bot token or chat ID is incorrect | Start a chat with the bot, recreate credentials, and confirm the target chat ID. |

## Important security reminder

Do not commit `backend/.env`, credentials, API keys, database passwords, Telegram bot tokens, or production chat IDs. Keep those values out of source control and rotate them promptly if exposed.
