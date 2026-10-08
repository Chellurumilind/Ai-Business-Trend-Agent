"""
routes/analytics.py
--------------------
Analytics API endpoints.
All routes prefixed with /api/v1 via main.py.

Endpoints:
    GET /analytics/summary   → Full analytics summary (feeds dashboard + AI)
    GET /analytics/monthly   → Monthly revenue/expense/profit breakdown
    GET /analytics/growth    → Month-over-month growth rates
    GET /analytics/categories → Spend by category
    GET /analytics/health    → Volatility and stability scores
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", summary="Full analytics summary")
def get_full_summary(db: Session = Depends(get_db)):
    """
    Returns the complete analytics payload:
    - Financial summary + ROI
    - Monthly trends
    - Growth analysis
    - Category breakdown
    - Volatility scores

    This is the primary endpoint consumed by the dashboard
    and used to feed the AI insight engine.
    """
    return analytics_service.get_full_analytics_summary(db)


@router.get("/monthly", summary="Monthly revenue and expense trends")
def get_monthly(db: Session = Depends(get_db)):
    """
    Returns month-by-month breakdown of revenue, expense,
    profit, and ROI. Used for trend charts in the dashboard.
    """
    return analytics_service.get_monthly_trends(db)


@router.get("/growth", summary="Month-over-month growth rates")
def get_growth(db: Session = Depends(get_db)):
    """
    Returns growth rate analysis including:
    - Per-month revenue and expense growth %
    - Average growth rates
    - Overall trend direction (growing / declining / stable)
    """
    return analytics_service.get_growth_analysis(db)


@router.get("/categories", summary="Spending and revenue by category")
def get_categories(db: Session = Depends(get_db)):
    """
    Returns totals grouped by category and type.
    Useful for identifying top cost centers and revenue sources.
    """
    return analytics_service.get_category_breakdown(db)


@router.get("/health", summary="Expense volatility and profit stability scores")
def get_health(db: Session = Depends(get_db)):
    """
    Returns financial health scores:
    - Expense volatility (0 = stable, 100 = chaotic)
    - Profit stability score (100 = perfectly stable)
    """
    return analytics_service.get_volatility_scores(db)