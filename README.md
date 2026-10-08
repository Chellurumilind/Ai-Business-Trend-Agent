# AI Business Trend Agent

A full-stack business-finance dashboard that records revenue and expenses, calculates performance metrics, generates AI-backed analysis, and can send scheduled Telegram updates through n8n.

![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-Automation-EA4B71?logo=n8n&logoColor=white)

## Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [How to use the app](#how-to-use-the-app)
- [API reference](#api-reference)
- [Automation with n8n](#automation-with-n8n)
- [Key calculations](#key-calculations)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

## What it does

The application gives a small business one place to monitor financial activity and act on it:

- Record **revenue** and **expense** transactions with categories and optional campaign labels.
- View total revenue, total expense, net profit, ROI, monthly performance, and month-over-month growth.
- Identify category-level revenue and spending, expense volatility, and profit stability.
- Request a structured AI report with executive summary, strengths, risks, anomalies, recommendations, and outlook.
- Automate daily ROI checks and weekly financial summaries with n8n and Telegram.

## Screenshots

### Business dashboard

The dashboard presents the primary KPIs alongside revenue-versus-expense, ROI, and growth charts.

![Business dashboard](docs/screenshots/dashboard.png)

### Add a transaction

Use the transaction form to record revenue or costs, assign a category, and optionally associate the entry with a campaign.

![Add transaction form](docs/screenshots/transaction.png)

### AI business insights

The insights page requests a data-grounded report from the configured OpenAI or Gemini provider.

![AI business insights](docs/screenshots/ai-insights.png)

### n8n automation workflow

The included daily workflow retrieves the analytics summary, evaluates ROI, then routes a suitable notification to Telegram.

![n8n daily workflow](docs/screenshots/workflow.png)

### Telegram alert

Notifications deliver the key financial results directly to Telegram.

![Telegram business alert](docs/screenshots/telegram-alert.png)

## Architecture

```mermaid
flowchart TB
    User["User"] --> Web["React + Vite frontend\nlocalhost:5173"]
    Web -->|"REST / JSON"| API["FastAPI backend\nlocalhost:8000"]
    API --> DB[("PostgreSQL\ntransactions")]
    API --> Analytics["Pandas analytics engine"]
    API --> AI["OpenAI or Gemini"]
    N8N["n8n scheduled workflows"] -->|"GET analytics summary"| API
    N8N --> Telegram["Telegram notifications"]
```

1. The React interface sends transaction and analytics requests to FastAPI.
2. FastAPI validates inputs with Pydantic and persists transactions through SQLAlchemy.
3. The analytics service loads transaction data into Pandas to calculate trends, growth, categories, and health indicators.
4. The insights service gives that calculated context to the selected AI provider.
5. n8n can call the analytics endpoint on a schedule and deliver the results to Telegram.

## Technology

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Recharts, Axios, React Router, Lucide |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic Settings, Pandas |
| Data | PostgreSQL, Alembic migrations |
| AI | OpenAI (`gpt-4o-mini`) or Google Gemini (`gemini-2.5-flash`) |
| Automation | n8n and the Telegram Bot API |

## Project structure

```text
ai-business-trend-agent/
├── backend/
│   ├── app/
│   │   ├── routes/          # Transaction, analytics, and insight endpoints
│   │   ├── services/        # CRUD, calculations, and AI-provider integration
│   │   ├── models/          # SQLAlchemy transaction model
│   │   ├── schemas/         # Pydantic request and response validation
│   │   └── core/            # Database configuration
│   ├── alembic/             # Database migration history
│   ├── .env.example         # Required runtime configuration
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Dashboard, Add Transaction, AI Insights
│       ├── components/      # Layout and reusable visual components
│       └── api/             # Central Axios API client
├── n8n/
│   ├── Daily Business Health Check.json
│   └── Weekly Business Summary.json
└── docs/screenshots/        # README images
```

## Getting started

For server-specific configuration, startup order, network connectivity, and production hardening, see the [Server Setup and Operations Guide](SERVER-README.md).

### Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL 15 or newer
- An OpenAI API key or Gemini API key for the AI insights feature
- n8n and a Telegram bot only if you want scheduled notifications

### 1. Create the database

Create an empty PostgreSQL database. The default local name used below is `business_trend_db`.

```sql
CREATE DATABASE business_trend_db;
```

### 2. Configure and start the backend

From the `backend` directory, create and activate a virtual environment, then install the Python dependencies.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy the environment template and set the values for your machine.

```powershell
Copy-Item .env.example .env
```

Example `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/business_trend_db

# Choose one provider: openai or gemini
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=

APP_NAME=AI Business Trend Agent
APP_VERSION=1.0.0
DEBUG=true
```

Run the database migration and start the API.

```powershell
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The API will be available at <http://localhost:8000>, and its interactive documentation at <http://localhost:8000/docs>.

### 3. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>). The frontend is configured to call the API at `http://localhost:8000/api/v1`.

### 4. Verify the installation

1. Visit <http://localhost:8000/docs> and confirm the API loads.
2. Open the web app and add at least one revenue or expense transaction.
3. Return to the dashboard and confirm totals and charts update.
4. Add transactions in at least two different months to see growth and volatility metrics.
5. Configure an AI provider before using **AI Insights**.

## How to use the app

### Record transactions

Navigate to **Add Transaction**, enter a positive amount, choose `revenue` or `expense`, and provide a category such as `Sales`, `Marketing`, or `Operations`. A campaign is optional and is useful for attribution, for example `Q3 Launch`.

### Read the dashboard

The dashboard refreshes its analytics when the page opens. It shows:

- **Total Revenue**: sum of all revenue transactions.
- **Total Expense**: sum of all expense transactions.
- **Net Profit**: revenue less expense.
- **ROI**: return on investment as a percentage.
- **Revenue vs Expense**: monthly comparison.
- **Monthly ROI Trend**: monthly return on investment.
- **Month-over-Month Growth**: revenue and expense change between consecutive months.

### Generate AI insights

Open **AI Insights** and select **Generate Insights**. The feature requires at least one saved transaction and a valid API key for the provider named in `AI_PROVIDER`. The report uses the current financial summary, trend direction, category totals, volatility, and stability scores.

## API reference

All application routes use the `/api/v1` prefix. FastAPI provides the definitive interactive schema at `/docs`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/transactions/` | Create a revenue or expense transaction |
| `GET` | `/transactions/` | List transactions; supports `skip`, `limit`, and optional `type` |
| `GET` | `/transactions/summary` | Return total revenue, expense, net profit, and ROI |
| `GET` | `/transactions/{transaction_id}` | Return one transaction |
| `DELETE` | `/transactions/{transaction_id}` | Delete one transaction |
| `GET` | `/analytics/summary` | Return the full dashboard payload |
| `GET` | `/analytics/monthly` | Return month-by-month revenue, expense, profit, and ROI |
| `GET` | `/analytics/growth` | Return month-over-month growth analysis |
| `GET` | `/analytics/categories` | Return revenue and expense totals by category |
| `GET` | `/analytics/health` | Return expense-volatility and profit-stability metrics |
| `GET` | `/insights/` | Generate an AI business report |

Example transaction request:

```bash
curl -X POST http://localhost:8000/api/v1/transactions/ \
  -H "Content-Type: application/json" \
  -d "{\"amount\": 2500, \"type\": \"revenue\", \"category\": \"Sales\", \"campaign\": \"Summer Launch\"}"
```

## Automation with n8n

The `n8n` directory contains ready-to-import workflows:

- `Daily Business Health Check.json` fetches `/api/v1/analytics/summary`, checks ROI, and routes either an alert or a healthy-status message to Telegram.
- `Weekly Business Summary.json` fetches the same summary and sends a Telegram report.

### Import a workflow

1. Start n8n and open <http://localhost:5678>.
2. Create a workflow, select the menu, then choose **Import from File**.
3. Import either JSON file from the `n8n` directory.
4. Open the Telegram node and create or select a Telegram credential.
5. Replace the sample chat ID with your own, adjust the API URL if n8n runs on another host, test the workflow, then activate it.

The checked-in daily workflow currently uses an ROI threshold of **20%** and a scheduled hour of **11**. Change these values in n8n to suit your operating hours and risk tolerance. The node label may still refer to an older 10% threshold.

> When n8n runs inside Docker, `127.0.0.1` refers to the n8n container rather than your host computer. Use a host-reachable API address or a shared Docker network instead.

See the more detailed [n8n guide](n8n/n8n-README.md) for Telegram setup and workflow customization notes.

## Key calculations

| Metric | Calculation | Interpretation |
| --- | --- | --- |
| Net profit | `revenue - expense` | Earnings after recorded expenses |
| ROI | `((revenue - expense) / expense) × 100` | Return generated per unit of expense; returns `0` if expense is zero |
| Revenue / expense growth | `((current - previous) / previous) × 100` | Percentage change from one month to the next |
| Trend direction | Average revenue growth | `growing` above 5%, `declining` below -5%, otherwise `stable` |
| Expense volatility | Monthly expense coefficient of variation | Higher values indicate less predictable spending |
| Profit stability | Inverse monthly profit coefficient of variation | Higher values indicate more consistent profit |

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Frontend says it cannot load analytics | Confirm the backend is running at port 8000 and PostgreSQL is available. |
| Backend will not start | Ensure `backend/.env` exists and contains a valid `DATABASE_URL`. |
| Migration cannot connect | Check your PostgreSQL service, credentials, database name, and port. |
| No growth chart | Add records dated across at least two different months. |
| AI insights return an error | Add at least one transaction, set `AI_PROVIDER` to `openai` or `gemini`, and supply the corresponding valid key. |
| n8n cannot reach the API | Verify the workflow URL is reachable from where n8n runs; containerized n8n needs a non-loopback host address. |
| Telegram does not receive messages | Start a chat with the bot, confirm its token and chat ID, then test the Telegram node in n8n. |

## Security notes

- Never commit `.env` files, AI keys, database passwords, Telegram bot tokens, or personal chat IDs. `.env` files are ignored by this repository.
- Keep n8n credentials in n8n's credential store instead of inserting secrets directly in workflow text.
- Review imported n8n workflows before enabling them, especially URLs, credentials, schedules, and chat IDs.
- The development CORS configuration permits `http://localhost:5173` only. Add authentication, production CORS origins, HTTPS, and a secrets-management strategy before deployment.

## Available scripts

### Frontend

```powershell
cd frontend
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

### Backend

```powershell
cd backend
alembic upgrade head                   # Apply database migrations
uvicorn app.main:app --reload --port 8000  # Start the development API
```

## License

No license file is currently included. Add a license before distributing or reusing this project outside its intended context.
