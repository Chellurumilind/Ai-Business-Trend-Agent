"""
services/transaction_service.py
--------------------------------
Business logic layer for transaction CRUD operations.
Routes call these functions — keeping endpoints thin and logic testable.

ROI Formula:
    ROI = ((Total Revenue - Total Expense) / Total Expense) × 100
    Returns 0.0 if no expenses exist (avoids division by zero).
"""

from datetime import date, datetime, time
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransactionSummary


# ── CREATE ────────────────────────────────────────────────────────────────────

def create_transaction(db: Session, data: TransactionCreate) -> Transaction:
    """
    Saves a new transaction to the database.
    Uses created_at from request if provided, otherwise defaults to now.
    """
    transaction = Transaction(
        amount=data.amount,
        type=data.type,
        category=data.category,
        campaign=data.campaign,
        created_at=data.created_at or datetime.utcnow()
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)  # Reload from DB to get generated id
    return transaction


# ── READ ──────────────────────────────────────────────────────────────────────

def get_all_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    type_filter: Optional[TransactionType] = None,
    category: Optional[str] = None,
    campaign: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> list[Transaction]:
    """
    Returns a paginated list of transactions.
    Optionally filters by type ('revenue' or 'expense').
    Results are ordered newest first.
    """
    query = db.query(Transaction)

    if type_filter:
        query = query.filter(Transaction.type == type_filter)
    if category:
        query = query.filter(Transaction.category.ilike(f"%{category.strip()}%"))
    if campaign:
        query = query.filter(Transaction.campaign.ilike(f"%{campaign.strip()}%"))
    if from_date:
        query = query.filter(
            Transaction.created_at >= datetime.combine(from_date, time.min)
        )
    if to_date:
        query = query.filter(
            Transaction.created_at <= datetime.combine(to_date, time.max)
        )

    return (
        query
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
    """
    Returns a single transaction by primary key.
    Returns None if not found (route will return 404).
    """
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()


# ── DELETE ────────────────────────────────────────────────────────────────────

def delete_transaction(db: Session, transaction_id: int) -> bool:
    """
    Deletes a transaction by id.
    Returns True if deleted, False if not found.
    """
    transaction = get_transaction_by_id(db, transaction_id)
    if not transaction:
        return False
    db.delete(transaction)
    db.commit()
    return True


# ── SUMMARY + ROI ─────────────────────────────────────────────────────────────

def get_summary(db: Session) -> TransactionSummary:
    """
    Calculates overall financial summary across all transactions.

    Aggregates:
        - Total revenue
        - Total expense
        - Net profit (revenue - expense)
        - ROI percentage

    Uses SQLAlchemy `func.sum` for efficient single-query aggregation.
    """
    # Single query — sum amounts grouped by type
    results = (
        db.query(
            Transaction.type,
            func.sum(Transaction.amount).label("total")
        )
        .group_by(Transaction.type)
        .all()
    )

    # Map results into a dict for easy access
    totals = {row.type: row.total for row in results}

    total_revenue = totals.get(TransactionType.revenue, 0.0)
    total_expense = totals.get(TransactionType.expense, 0.0)
    net_profit    = total_revenue - total_expense
    total_records = db.query(Transaction).count()

    # ROI calculation — guard against division by zero
    if total_expense > 0:
        roi = ((total_revenue - total_expense) / total_expense) * 100
    else:
        roi = 0.0

    return TransactionSummary(
        total_records=total_records,
        total_revenue=round(total_revenue, 2),
        total_expense=round(total_expense, 2),
        net_profit=round(net_profit, 2),
        roi=round(roi, 2)
    )
