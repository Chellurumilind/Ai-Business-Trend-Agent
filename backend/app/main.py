"""
main.py
-------
FastAPI application entry point.
All three routers are now registered under /api/v1.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import transactions, analytics, insights

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Business Trend Analysis Agent — API Documentation",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(analytics.router,    prefix="/api/v1")
app.include_router(insights.router,     prefix="/api/v1")


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs"
    }