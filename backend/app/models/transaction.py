"""
models/transaction.py
---------------------
SQLAlchemy ORM model for the `transactions` table.

Refinements applied:
  - Python Enum enforces 'revenue' | 'expense' at application + DB level
  - Index on `created_at` speeds up date-range analytics queries
  - Index on `type` speeds up revenue vs expense filter queries
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String,
    DateTime, Enum as SAEnum, Index
)
from app.core.database import Base


class TransactionType(str, enum.Enum):
    """
    Enum for transaction type.
    Inherits from `str` so it serializes cleanly to JSON as a plain string.
    Only two valid values exist — anything else is rejected automatically.
    """
    revenue = "revenue"
    expense = "expense"


class Transaction(Base):
    """
    ORM model mapping to the `transactions` table in PostgreSQL.

    Columns:
        id         : Auto-incrementing primary key
        amount     : Dollar value of the transaction (must be positive)
        type       : Enum — either 'revenue' or 'expense'
        category   : Business category e.g. 'Marketing', 'Operations'
        campaign   : Optional campaign name for tracking purposes
        created_at : Timestamp — defaults to current UTC time
    """

    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    amount = Column(
        Float,
        nullable=False
    )

    type = Column(
        SAEnum(TransactionType, name="transactiontype"),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    campaign = Column(
        String(200),
        nullable=True  # Optional field
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ── Performance Indexes ───────────────────────────────────────────────────
    __table_args__ = (
        # Speeds up monthly/date-range analytics queries
        Index("ix_transactions_created_at", "created_at"),
        # Speeds up filtering revenue vs expense records
        Index("ix_transactions_type", "type"),
    )

    def __repr__(self):
        return (
            f"<Transaction id={self.id} "
            f"type={self.type} "
            f"amount={self.amount} "
            f"category={self.category}>"
        )