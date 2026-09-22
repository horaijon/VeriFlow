"""
schemas.py  –  Strict Pydantic models for LLM output validation.

These schemas act as the "Zero-Trust Evidence Gate."  The LLM MUST
produce output that satisfies every field constraint defined here,
or Python will throw a hard ValidationError with an actionable
error message that gets fed back to the LLM for self-healing.

IMPORTANT:  This file contains NO LLM calls.  It is pure,
deterministic Python validation logic.
"""

from __future__ import annotations

import datetime as _dt
from typing import Optional

# Alias to avoid Pydantic field-name / type-name collision.
DateType = _dt.date

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class Invoice(BaseModel):
    """
    Strict schema for an extracted invoice.

    Every field is **required** and type-checked.  Pydantic's
    `model_config = ConfigDict(strict=True)` would reject int→float
    coercion, but we deliberately allow it so "100" can become 100.0.
    We DO forbid extra fields the LLM might hallucinate.
    """

    model_config = ConfigDict(
        # Reject any keys the LLM invents that are not in the schema.
        extra="forbid",
        # Strip leading / trailing whitespace from strings.
        str_strip_whitespace=True,
    )

    customer_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Full name of the customer on the invoice.",
    )

    invoice_amount: float = Field(
        ...,
        gt=0,
        description="Total invoice amount in the original currency. Must be > 0.",
    )

    date: DateType = Field(
        ...,
        description="Invoice date in YYYY-MM-DD format.",
    )

    # ------------------------------------------------------------------ #
    #  Field-level validators
    # ------------------------------------------------------------------ #

    @field_validator("customer_name")
    @classmethod
    def customer_name_must_not_be_placeholder(cls, v: str) -> str:
        """Catch common LLM placeholders like 'string' or 'N/A'."""
        placeholders = {"string", "n/a", "null", "none", "unknown", "placeholder", "test"}
        if v.strip().lower() in placeholders:
            raise ValueError(
                f"'{v}' looks like a placeholder, not a real customer name. "
                "Extract the actual name from the source text."
            )
        return v

    @field_validator("date", mode="before")
    @classmethod
    def parse_flexible_date(cls, v):
        """
        Accept several date formats the LLM might produce:
          - 2024-01-15          (ISO)
          - 2024-01-15T00:00:00 (datetime string)
          - 01/15/2024          (US style)
          - 15-01-2024          (DD-MM-YYYY)
          - January 15, 2024    (long form)

        Returns a date object or raises ValueError with a clear message.
        """
        if isinstance(v, DateType):
            return v
        if isinstance(v, _dt.datetime):
            return v.date()
        if not isinstance(v, str):
            raise ValueError(
                f"Expected a date string in YYYY-MM-DD format, got {type(v).__name__}."
            )

        v = v.strip()

        # Try common formats in order of likelihood.
        formats = [
            "%Y-%m-%d",          # 2024-01-15
            "%Y-%m-%dT%H:%M:%S", # 2024-01-15T00:00:00
            "%m/%d/%Y",          # 01/15/2024
            "%d-%m-%Y",          # 15-01-2024
            "%B %d, %Y",        # January 15, 2024
            "%b %d, %Y",        # Jan 15, 2024
            "%d %B %Y",         # 15 January 2024
            "%d %b %Y",         # 15 Jan 2024
        ]

        for fmt in formats:
            try:
                return _dt.datetime.strptime(v, fmt).date()
            except ValueError:
                continue

        raise ValueError(
            f"Could not parse '{v}' as a date. "
            "Use YYYY-MM-DD format (e.g. 2024-01-15)."
        )

    @field_validator("invoice_amount", mode="before")
    @classmethod
    def coerce_amount_from_string(cls, v):
        """
        The LLM sometimes returns the amount as a string like
        '$1,234.56' or '1 234.56'.  Strip currency symbols and
        thousand separators before casting to float.
        """
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            cleaned = v.strip()
            # Remove common currency symbols and thousand separators.
            for ch in ("$", "€", "£", "¥", "₹", ",", " "):
                cleaned = cleaned.replace(ch, "")
            try:
                return float(cleaned)
            except ValueError:
                raise ValueError(
                    f"Could not convert '{v}' to a number. "
                    "Provide the invoice amount as a plain number (e.g. 1234.56)."
                )
        raise ValueError(
            f"Expected a number for invoice_amount, got {type(v).__name__}."
        )
