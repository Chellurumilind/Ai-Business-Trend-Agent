"""
services/analytics_service.py
------------------------------
Core analytics engine powered by Pandas.

Calculates:
  - Monthly revenue and expense totals
  - Month-over-month growth rates
  - Revenue trend direction (growing / declining / stable)
  - Expense volatility score
  - Profit stability score
  - Per-category breakdown
  - Full summary for AI prompt context
"""

import pandas as pd
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, TransactionType
from app.utils.helpers import calculate_roi, calculate_growth_rate, get_month_label


# ── RAW DATA LOADER ───────────────────────────────────────────────────────────

def load_transactions_as_dataframe(db: Session) -> pd.DataFrame:
    """
    Loads all transactions from PostgreSQL into a Pandas DataFrame.
    Adds helper columns for year and month grouping.
    Returns an empty DataFrame with correct columns if no data exists.
    """
    transactions = db.query(Transaction).all()

    if not transactions:
        return pd.DataFrame(columns=[
            "id", "amount", "type", "category", "campaign", "created_at"
        ])

    df = pd.DataFrame([{
        "id":         t.id,
        "amount":     t.amount,
        "type":       t.type.value,  # Convert Enum to string
        "category":   t.category,
        "campaign":   t.campaign,
        "created_at": t.created_at
    } for t in transactions])

    # Parse datetime and extract period columns for grouping
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["year"]       = df["created_at"].dt.year
    df["month"]      = df["created_at"].dt.month
    df["period"]     = df["created_at"].dt.to_period("M")

    return df


# ── MONTHLY TRENDS ────────────────────────────────────────────────────────────

def get_monthly_trends(db: Session) -> list[dict]:
    """
    Returns monthly revenue, expense, profit, and ROI for every month
    that has at least one transaction.

    Output shape (one item per month):
    {
        "month":   "Jan 2024",
        "revenue": 15000.0,
        "expense": 5000.0,
        "profit":  10000.0,
        "roi":     200.0
    }
    """
    df = load_transactions_as_dataframe(db)

    if df.empty:
        return []

    # Pivot: rows = period, columns = type, values = sum of amount
    monthly = (
        df.groupby(["year", "month", "period", "type"])["amount"]
        .sum()
        .unstack(fill_value=0)
        .reset_index()
    )

    # Ensure both columns exist even if one type has no data
    for col in ["revenue", "expense"]:
        if col not in monthly.columns:
            monthly[col] = 0.0

    results = []
    for _, row in monthly.sort_values(["year", "month"]).iterrows():
        revenue = round(row.get("revenue", 0.0), 2)
        expense = round(row.get("expense", 0.0), 2)
        profit  = round(revenue - expense, 2)
        roi     = calculate_roi(revenue, expense)

        results.append({
            "month":   get_month_label(int(row["year"]), int(row["month"])),
            "revenue": revenue,
            "expense": expense,
            "profit":  profit,
            "roi":     roi
        })

    return results


# ── GROWTH RATES ──────────────────────────────────────────────────────────────

def get_growth_analysis(db: Session) -> dict:
    """
    Calculates month-over-month growth rates for revenue and expense.
    Also determines the overall trend direction.

    Returns:
    {
        "monthly_growth": [...],
        "avg_revenue_growth": 12.5,
        "avg_expense_growth": 4.2,
        "trend_direction": "growing"   # growing | declining | stable
    }
    """
    monthly = get_monthly_trends(db)

    if len(monthly) < 2:
        return {
            "monthly_growth":      [],
            "avg_revenue_growth":  0.0,
            "avg_expense_growth":  0.0,
            "trend_direction":     "stable",
            "message":             "Need at least 2 months of data for growth analysis"
        }

    growth_data = []
    for i in range(1, len(monthly)):
        prev = monthly[i - 1]
        curr = monthly[i]

        revenue_growth = calculate_growth_rate(curr["revenue"], prev["revenue"])
        expense_growth = calculate_growth_rate(curr["expense"], prev["expense"])
        profit_growth  = calculate_growth_rate(curr["profit"],  prev["profit"])

        growth_data.append({
            "month":          curr["month"],
            "revenue_growth": revenue_growth,
            "expense_growth": expense_growth,
            "profit_growth":  profit_growth
        })

    # Average growth rates across all months
    avg_revenue_growth = round(
        sum(g["revenue_growth"] for g in growth_data) / len(growth_data), 2
    )
    avg_expense_growth = round(
        sum(g["expense_growth"] for g in growth_data) / len(growth_data), 2
    )

    # Trend direction based on average revenue growth
    if avg_revenue_growth > 5:
        trend_direction = "growing"
    elif avg_revenue_growth < -5:
        trend_direction = "declining"
    else:
        trend_direction = "stable"

    return {
        "monthly_growth":      growth_data,
        "avg_revenue_growth":  avg_revenue_growth,
        "avg_expense_growth":  avg_expense_growth,
        "trend_direction":     trend_direction
    }


# ── CATEGORY BREAKDOWN ────────────────────────────────────────────────────────

def get_category_breakdown(db: Session) -> list[dict]:
    """
    Returns total spend and revenue grouped by category.
    Useful for identifying top spending areas and revenue sources.

    Output shape:
    [
        {"category": "Marketing", "type": "expense", "total": 12000.0},
        {"category": "Product Sales", "type": "revenue", "total": 45000.0}
    ]
    """
    df = load_transactions_as_dataframe(db)

    if df.empty:
        return []

    breakdown = (
        df.groupby(["category", "type"])["amount"]
        .sum()
        .reset_index()
        .rename(columns={"amount": "total"})
        .sort_values("total", ascending=False)
    )

    return breakdown.to_dict(orient="records")


# ── VOLATILITY & STABILITY ────────────────────────────────────────────────────

def get_volatility_scores(db: Session) -> dict:
    """
    Calculates financial health scores:

    - Expense Volatility  : Standard deviation of monthly expenses.
                            High = unpredictable spending. Low = stable costs.

    - Profit Stability    : Coefficient of variation of monthly profit.
                            Lower is better (more consistent profit).

    Scores are normalized to 0–100:
        0   = perfectly stable / no volatility
        100 = extremely volatile
    """
    monthly = get_monthly_trends(db)

    if len(monthly) < 2:
        return {
            "expense_volatility":  0.0,
            "profit_stability":    100.0,
            "message": "Need at least 2 months of data for volatility analysis"
        }

    expenses = [m["expense"] for m in monthly]
    profits  = [m["profit"]  for m in monthly]

    expense_series = pd.Series(expenses)
    profit_series  = pd.Series(profits)

    # Coefficient of Variation = (StdDev / Mean) × 100
    expense_cv = round(
        (expense_series.std() / expense_series.mean() * 100)
        if expense_series.mean() != 0 else 0.0, 2
    )

    # Profit stability = inverse of profit CV, capped at 100
    profit_cv = (
        (profit_series.std() / abs(profit_series.mean()) * 100)
        if profit_series.mean() != 0 else 100.0
    )
    profit_stability = round(max(0.0, 100.0 - profit_cv), 2)

    return {
        "expense_volatility": expense_cv,
        "profit_stability":   profit_stability
    }


# ── FULL ANALYTICS SUMMARY ────────────────────────────────────────────────────

def get_full_analytics_summary(db: Session) -> dict:
    """
    Combines all analytics into a single response.
    This is the primary endpoint payload and also feeds the AI prompt.
    """
    from app.services.transaction_service import get_summary

    summary    = get_summary(db)
    monthly    = get_monthly_trends(db)
    growth     = get_growth_analysis(db)
    categories = get_category_breakdown(db)
    volatility = get_volatility_scores(db)

    return {
        "summary":    summary.model_dump(),
        "monthly":    monthly,
        "growth":     growth,
        "categories": categories,
        "volatility": volatility
    }