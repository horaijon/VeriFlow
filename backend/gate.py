"""
gate.py  –  The Zero-Trust Evidence Gate.

This is the single entry-point the backend / agent calls.
It receives a raw JSON string from the LLM, tries to parse it
against the strict Pydantic Invoice schema, and returns a
deterministic verdict:

    {"is_valid": True,  "error_details": None,           "parsed_data": { … }}
    {"is_valid": False, "error_details": "Human-readable error …", "parsed_data": None}

NO LLM is used anywhere in this file.  This is 100 % deterministic
Python validation logic — the "evidence" that proves the LLM got it
right (or catches it lying).
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from schemas import Invoice


def validate_llm_output(json_string: str, model_class=None) -> dict[str, Any]:
    """
    Validate a raw JSON string against the Invoice Pydantic schema or a dynamic model.

    Parameters
    ----------
    json_string : str
        The raw string that the LLM returned.  It should be valid JSON
        conforming to the Invoice schema.

    Returns
    -------
    dict with three keys:
        is_valid      – bool
        error_details – str | None   (the exact Pydantic error message
                                      if validation failed)
        parsed_data   – dict | None  (the validated & cleaned data on
                                      success)
    """

    # -------------------------------------------------------------- #
    # Step 1 – Clean markdown and make sure the string is valid JSON.
    # -------------------------------------------------------------- #
    # Strip common markdown formatting the LLM might add.
    cleaned_string = json_string.strip() if isinstance(json_string, str) else json_string
    if isinstance(cleaned_string, str) and cleaned_string.startswith("```"):
        lines = cleaned_string.splitlines()
        if len(lines) >= 2:
            # Drop the first line (```json) and last line (```)
            cleaned_string = "\n".join(lines[1:-1]).strip()

    try:
        raw = json.loads(cleaned_string)
    except (json.JSONDecodeError, TypeError) as exc:
        return {
            "is_valid": False,
            "error_details": (
                f"The output is not valid JSON. "
                f"JSON parse error: {exc}. "
                f"Return a raw JSON object, not markdown or plain text."
            ),
            "parsed_data": None,
        }

    # -------------------------------------------------------------- #
    # Step 2 – Make sure the parsed value is a JSON object (dict).
    # -------------------------------------------------------------- #
    if not isinstance(raw, dict):
        return {
            "is_valid": False,
            "error_details": (
                f"Expected a JSON object ({{}}), but got {type(raw).__name__}. "
                f"Return a single JSON object with keys: "
                f"customer_name, invoice_amount, date."
            ),
            "parsed_data": None,
        }

    # -------------------------------------------------------------- #
    # Step 3 – Validate against the strict Pydantic Invoice model.
    # -------------------------------------------------------------- #
    target_model = model_class if model_class else Invoice
    try:
        invoice = target_model(**raw)
    except ValidationError as exc:
        # Build a concise, actionable error message the LLM can act on.
        error_lines: list[str] = []
        for err in exc.errors():
            loc = " → ".join(str(part) for part in err["loc"]) or "(root)"
            error_lines.append(f"  • Field '{loc}': {err['msg']}")

        friendly_msg = (
            "Pydantic validation failed with "
            f"{exc.error_count()} error(s):\n"
            + "\n".join(error_lines)
            + "\n\nFix the listed fields and return corrected JSON."
        )

        return {
            "is_valid": False,
            "error_details": friendly_msg,
            "parsed_data": None,
            "partial_data": raw,
        }

    # -------------------------------------------------------------- #
    # Step 4 – Success!  Return the cleaned, validated data.
    # -------------------------------------------------------------- #
    return {
        "is_valid": True,
        "error_details": None,
        "parsed_data": invoice.model_dump(mode="json"),
        # mode="json" serialises date → "YYYY-MM-DD" string
    }
