"""
schemas/transaction.py
----------------------
Pydantic v2 schemas for request validation and response serialization.

Three schemas follow the standard pattern:
  - TransactionBase    : shared fields
  - TransactionCreate  : used for POST requests (input)
  - TransactionResponse: used for GET responses (output, includes id + created_at)

This separation ensures:
  - Input never exposes internal fields (id, created_at)
  - Output always includes full data
  - Validation errors return clean 422 responses automatically
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    """
    Shared fields between create and response schemas.
    """
    amount: float = Field(
        ...,
        gt=0,  # Must be greater than 0
        description="Transaction amount in dollars (must be positive)"
    )
    type: TransactionType = Field(
        ...,
        description="Either 'revenue' or 'expense'"
    )
    category: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Business category e.g. Marketing, Operations"
    )
    campaign: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Optional campaign name"
    )

    @field_validator("category")
    @classmethod
    def category_must_not_be_blank(cls, v: str) -> str:
        """Strips whitespace and rejects blank category strings."""
        v = v.strip()
        if not v:
            raise ValueError("Category cannot be blank or whitespace")
        return v


class TransactionCreate(TransactionBase):
    """
    Schema for POST /api/v1/transactions requests.
    Optionally accepts a custom created_at date (useful for importing
    historical data). Defaults to current time if not provided.
    """
    created_at: Optional[datetime] = Field(
        default=None,
        description="Optional date override — defaults to now if not provided"
    )


class TransactionResponse(TransactionBase):
    """
    Schema for API responses.
    Includes id and created_at which are generated server-side.
    """
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}  # Allows ORM object → Pydantic


class TransactionSummary(BaseModel):
    """
    Lightweight schema returned in list endpoints showing totals.
    """
    total_records: int
    total_revenue: float
    total_expense: float
    net_profit: float
    roi: float


class InsightQuestion(BaseModel):
    """A natural-language question about the current business data."""
    question: str = Field(..., min_length=3, max_length=500)
