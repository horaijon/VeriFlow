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
    Contains the final status, the parsed output (if successful),
    and the complete execution log for the timeline visualizer.
    """
    status: str = Field(
        ...,
        description="'Success', 'Requires Human Review', or 'Failed after N retries'",
    )
    final_output: Optional[dict[str, Any]] = Field(
        default=None,
        description="The validated, structured invoice data (if extraction succeeded).",
    )
    fields_needing_review: list[str] = Field(
        default_factory=list,
        description="List of field names that are missing or invalid and need human input.",
    )
    attempts: list[AttemptRecord] = Field(
        default_factory=list,
        description="Ordered list of every attempt for the execution log timeline.",
    )
    total_attempts: int = 0
    max_retries: int = 5
