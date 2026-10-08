"""
utils/helpers.py
----------------
Shared utility functions used across services.
Keeps service files clean by centralizing reusable logic.
"""

from datetime import datetime
from typing import Union


def safe_divide(numerator: float, denominator: float, fallback: float = 0.0) -> float:
    """
    Divides two numbers safely.
    Returns `fallback` instead of raising ZeroDivisionError.

    Usage:
        safe_divide(100, 0)      → 0.0
        safe_divide(100, 50)     → 2.0
        safe_divide(100, 0, -1)  → -1.0
    """
    if denominator == 0:
        return fallback
    return numerator / denominator


def calculate_roi(revenue: float, expense: float) -> float:
    """
    Calculates Return on Investment as a percentage.

    Formula:
        ROI = ((Revenue - Expense) / Expense) × 100

    Returns 0.0 if expense is zero to avoid division by zero.
    """
    return round(safe_divide((revenue - expense), expense) * 100, 2)


def calculate_growth_rate(current: float, previous: float) -> float:
    """
    Calculates percentage growth between two periods.

    Formula:
        Growth = ((Current - Previous) / Previous) × 100

    Returns 0.0 if previous period had no value.
    """
    return round(safe_divide((current - previous), previous) * 100, 2)


def format_currency(amount: float) -> str:
    """
    Formats a float as a USD currency string.

    Usage:
        format_currency(15000.5) → "$15,000.50"
    """
    return f"${amount:,.2f}"


def get_month_label(year: int, month: int) -> str:
    """
    Converts year + month integers into a readable label.

    Usage:
        get_month_label(2024, 3) → "Mar 2024"
    """
    return datetime(year, month, 1).strftime("%b %Y")