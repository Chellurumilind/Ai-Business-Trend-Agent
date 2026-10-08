"""
routes/transactions.py
----------------------
CRUD API endpoints for transactions.
All routes are prefixed with /api/v1 in main.py.

Endpoints:
    POST   /transactions          → Create a transaction
    GET    /transactions          → List all (with optional filter + pagination)
    GET    /transactions/summary  → ROI and totals
    GET    /transactions/{id}     → Get one transaction
    DELETE /transactions/{id}     → Delete a transaction
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionSummary
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ── POST /transactions ────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new transaction"
)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new revenue or expense transaction.

    - **amount**: Must be greater than 0
    - **type**: Must be `revenue` or `expense`
    - **category**: Business category label
    - **campaign**: Optional campaign name
    - **created_at**: Optional — defaults to current time if not provided
    """
    return transaction_service.create_transaction(db, data)


# ── GET /transactions ─────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=list[TransactionResponse],
    summary="List all transactions"
)
def get_transactions(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=500, description="Max records to return"),
    type_filter: Optional[TransactionType] = Query(
        default=None,
        alias="type",
        description="Filter by 'revenue' or 'expense'"
    ),
    category: Optional[str] = Query(default=None, max_length=100),
    campaign: Optional[str] = Query(default=None, max_length=200),
    from_date: Optional[date] = Query(default=None, alias="from"),
    to_date: Optional[date] = Query(default=None, alias="to"),
    db: Session = Depends(get_db)
):
    """
    Returns a list of transactions, newest first.
    Supports pagination with `skip` and `limit`.
    Optionally filter by type using `?type=revenue` or `?type=expense`.
    """
    return transaction_service.get_all_transactions(
        db,
        skip=skip,
        limit=limit,
        type_filter=type_filter,
        category=category,
        campaign=campaign,
        from_date=from_date,
        to_date=to_date,
    )


# ── GET /transactions/summary ─────────────────────────────────────────────────

@router.get(
    "/summary",
    response_model=TransactionSummary,
    summary="Get financial summary and ROI"
)
def get_summary(db: Session = Depends(get_db)):
    """
    Returns overall financial summary:
    - Total revenue
    - Total expense
    - Net profit
    - ROI percentage

    ROI = ((Revenue - Expense) / Expense) × 100
    """
    return transaction_service.get_summary(db)


# ── GET /transactions/{id} ────────────────────────────────────────────────────

@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get a single transaction by ID"
)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Returns a single transaction. Returns 404 if not found."""
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )
    return transaction


# ── DELETE /transactions/{id} ─────────────────────────────────────────────────

@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a transaction"
)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Deletes a transaction by ID. Returns 404 if not found."""
    deleted = transaction_service.delete_transaction(db, transaction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )
