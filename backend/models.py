from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

# ── Request from Frontend ───────────────────────────────────────────
class ProcessRequest(BaseModel):
    """Raw messy text submitted by the user for extraction."""
    raw_text: str = Field(
        ...,
        min_length=1,
        description="The unstructured text to extract invoice data from.",
        json_schema_extra={"example": "Client: John Doe. Amount: One hundred dollars. Date: Tomorrow."},
    )
    use_case: str = Field(default="invoice", description="The use case template ID")


# ── Evidence Gate contract ──────────────────────────────────────────
class ValidationResult(BaseModel):
    """
    Result returned by the Evidence Gate after validating LLM output.
    Matches the schema_contract.md specification.
    """
    is_valid: bool
    error_details: Optional[str] = None
    pydantic_errors: Optional[list[dict[str, Any]]] = None


# ── Single attempt record (for the execution log) ──────────────────
class AttemptRecord(BaseModel):
    """One cycle of: Agent produces JSON → Evidence Gate validates it."""
    attempt_number: int
    agent_output: Optional[str] = Field(
        default=None,
        description="Raw JSON string returned by the LLM agent.",
    )
    validation: Optional[ValidationResult] = Field(
        default=None,
        description="Evidence Gate result for this attempt.",
    )


# ── Final response to Frontend ──────────────────────────────────────
class ProcessResponse(BaseModel):
    """
    Full response sent back to the React frontend.
    """
    status: str = Field(
        ...,
        description="'Success', 'needs_clarification', or 'Failed after N retries'",
    )
    final_output: Optional[dict[str, Any]] = Field(
        default=None,
        description="The validated, structured data (if extraction succeeded).",
    )
    missing_fields: list[dict[str, Any]] = Field(
        default_factory=list,
        description="List of dicts containing 'field' and 'reason' for missing/invalid fields.",
    )
    partial_data: Optional[dict[str, Any]] = Field(
        default=None,
        description="The raw JSON the LLM managed to generate before failing.",
    )
    attempts: list[AttemptRecord] = Field(
        default_factory=list,
        description="Ordered list of every attempt for the execution log timeline.",
    )
    total_attempts: int = 0
    max_retries: int = 5


class ResolveRequest(BaseModel):
    use_case: str
    partial_data: dict[str, Any]
    user_inputs: dict[str, Any]


class ResolveResponse(BaseModel):
    status: str
    final_data: dict[str, Any]
    errors: Optional[list[dict[str, Any]]] = None
