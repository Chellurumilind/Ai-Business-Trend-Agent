"""
routes/insights.py
-------------------
AI Insight endpoint.
Fetches analytics data and passes it to the AI service for analysis.

Endpoints:
    GET /insights   → Generate AI business insight report
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.transaction import InsightQuestion
from app.services import analytics_service, ai_service

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.post("/chat", summary="Ask a question about current business data")
async def chat_with_business_data(
    data: InsightQuestion,
    db: Session = Depends(get_db)
):
    """Returns an AI answer grounded in the current analytics summary."""
    analytics = analytics_service.get_full_analytics_summary(db)
    total_records = analytics.get("summary", {}).get("total_records", 0)
    if total_records == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transaction data found. Add a transaction before asking a question."
        )

    result = await ai_service.answer_business_question(data.question, analytics)
    return {
        "status": "success",
        "question": data.question,
        "provider": result["provider"],
        "model": result["model"],
        "answer": result["answer"]
    }


@router.get("/", summary="Generate AI-powered business insights")
async def get_insights(db: Session = Depends(get_db)):
    """
    Generates a full AI business insight report.

    Process:
    1. Fetches complete analytics summary from the database
    2. Builds a structured prompt with all financial data
    3. Calls OpenAI or Gemini (configured via AI_PROVIDER in .env)
    4. Returns the AI-generated report with provider metadata

    Requires at least one transaction to exist in the database.
    AI provider must be configured in the .env file.
    """
    # Fetch analytics data to feed into the AI prompt
    analytics = analytics_service.get_full_analytics_summary(db)

    # Guard: ensure there is data to analyze
    total_records = analytics.get("summary", {}).get("total_records", 0)
    if total_records == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No transaction data found. "
                "Please add at least one transaction before generating insights."
            )
        )

    # Call AI service — async to avoid blocking
    result = await ai_service.generate_insights(analytics)

    return {
        "status":    "success",
        "provider":  result["provider"],
        "model":     result["model"],
        "insights":  result["insights"],
        "data_used": {
            "total_records":  total_records,
            "total_revenue":  analytics["summary"]["total_revenue"],
            "total_expense":  analytics["summary"]["total_expense"],
            "roi":            analytics["summary"]["roi"],
            "trend":          analytics["growth"].get("trend_direction", "unknown")
        }
    }
