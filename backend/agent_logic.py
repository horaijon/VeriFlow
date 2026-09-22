"""
Agent Logic — The Agentic Brain (Person 2)
==========================================
Uses the Google Gemini SDK to extract structured data from messy text.
Implements a self-healing retry loop: if the Evidence Gate rejects the output,
the exact error is fed back to Gemini so it can correct itself (up to 3 attempts).

Integration contract:
  - Person 1 (Orchestrator) calls `call_gemini(raw_text, attempt_number, previous_error)`
  - This function returns a raw JSON string
  - Person 3's Evidence Gate validates the JSON string
  - If validation fails, Person 1 calls this function again with the error details
"""

import os
import json
import re
from dotenv import load_dotenv
from google import genai

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()  # loads GEMINI_API_KEY from .env file

MODEL_ID = "gemini-3.6-flash"  # fast, cheap, great for structured extraction

# Lazy-initialized client — created on first call_gemini() invocation
# so the module can be imported and tested without an API key.
_client = None


def _get_client() -> genai.Client:
    """Get or create the Gemini client (lazy init)."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not set. Copy .env.example to .env and add your key. "
                "Get one free at: https://aistudio.google.com/apikey"
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = (
    "You are a precise data-extraction assistant. "
    "Your ONLY job is to read messy, unstructured text and extract the data "
    "into a strict JSON object. You must output ONLY valid JSON — no markdown "
    "fences, no explanation, no extra text. Just the raw JSON object."
)

EXTRACTION_PROMPT = """\
Extract the following fields from the messy text below and return them as a \
JSON object with EXACTLY these keys and types:

{schema_json}

Rules:
- For every data field, you MUST also provide a "<field_name>_source_quote" field containing the EXACT substring from the source text that proves your extraction. If the information is inferred (not directly quoted), write "[inferred]".
- Output ONLY the JSON object. No markdown, no backticks, no explanation.

--- BEGIN MESSY TEXT ---
{raw_text}
--- END MESSY TEXT ---
"""

RETRY_PROMPT = """\
Your previous output was rejected by our strict validation system.

VALIDATION ERROR:
{error}

ORIGINAL MESSY TEXT:
{raw_text}

Fix ONLY the fields that caused the error. Return the corrected JSON object \
with EXACTLY these keys and types:

{schema_json}

Output ONLY the raw JSON object. No markdown, no backticks, no explanation.
"""


# ---------------------------------------------------------------------------
# Core function — this is what Person 1's backend calls
# ---------------------------------------------------------------------------

def build_schema_prompt(use_case: dict) -> str:
    """Build a JSON template string from a use case definition for the LLM prompt."""
    lines = ['{']
    for f in use_case['fields']:
        type_hint = f['type']
        lines.append(f'  "{f["name"]}": <{type_hint} — {f["description"]}>,') 
    if use_case.get('source_quotes'):
        lines.append('  // For EACH field above, also include:')
        lines.append('  "<field_name>_source_quote": "<exact substring from the source text proving this value>"')
    lines.append('}')
    return '\n'.join(lines)


def call_gemini(raw_text: str, attempt_number: int, previous_error: str | None, schema_description: str = None) -> str:
    """
    Call Gemini to extract structured JSON from messy text.

    Args:
        raw_text:        The original messy/unstructured text to parse.
        attempt_number:  Which attempt this is (1 = first try, 2 = first retry, etc.)
        previous_error:  The validation error from the Evidence Gate on the last
                         attempt, or None if this is the first attempt.
        schema_description: The formatted string showing the target JSON structure.
    """
    
    default_schema = '''{
  "customer_name": "<string>",
  "invoice_amount": <float>,
  "currency": "<string>",
  "date": "<YYYY-MM-DD>",
  "is_paid": <boolean>,
  "line_items": ["<string>"]
}'''
    schema_json = schema_description if schema_description else default_schema

    # Build the prompt depending on whether this is a first attempt or a retry
    if attempt_number == 1 or previous_error is None:
        user_prompt = EXTRACTION_PROMPT.format(raw_text=raw_text, schema_json=schema_json)
    else:
        user_prompt = RETRY_PROMPT.format(error=previous_error, raw_text=raw_text, schema_json=schema_json)

    # Call Gemini
    response = _get_client().models.generate_content(
        model=MODEL_ID,
        contents=user_prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.1,
        ),
    )

    # Extract the text from the response
    raw_output = response.text.strip()

    # Clean up common LLM quirks: strip markdown code fences if present
    raw_output = _strip_markdown_fences(raw_output)

    return raw_output


# ---------------------------------------------------------------------------
# Helper: strip markdown fences that LLMs love to add
# ---------------------------------------------------------------------------

def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers if present."""
    # Pattern: optional ```json or ``` at start, ``` at end
    pattern = r"^```(?:json)?\s*\n?(.*?)\n?\s*```$"
    match = re.match(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


# ---------------------------------------------------------------------------
# Standalone runner — the full self-healing loop for local testing
# ---------------------------------------------------------------------------

def run_self_healing_extraction(raw_text: str, max_attempts: int = 3) -> dict:
    """
    Run the full extraction loop with self-healing retries.
    This is for LOCAL TESTING ONLY. In production, Person 1's backend
    orchestrates the loop by calling call_gemini() and evidence_gate() separately.

    Returns a dict with the full execution log:
    {
        "final_status": "success" | "failed",
        "attempts": [
            {
                "attempt_number": int,
                "llm_output": str,
                "validation": {"is_valid": bool, "error_details": str | None}
            },
            ...
        ],
        "extracted_data": dict | None
    }
    """
    # Import evidence gate for local testing (optional — may not be available)
    try:
        from evidence_gate import validate_llm_output
    except ImportError:
        # If Person 3's code isn't available yet, use a basic JSON check
        validate_llm_output = _fallback_validator

    attempts_log = []
    previous_error = None

    for attempt in range(1, max_attempts + 1):
        print(f"\n{'='*60}")
        print(f"  ATTEMPT {attempt} of {max_attempts}")
        print(f"{'='*60}")

        # Step 1: Call Gemini
        try:
            llm_output = call_gemini(raw_text, attempt, previous_error)
        except Exception as e:
            llm_output = ""
            print(f"  [ERROR] Gemini call failed: {e}")
            attempts_log.append({
                "attempt_number": attempt,
                "llm_output": f"ERROR: {e}",
                "validation": {"is_valid": False, "error_details": f"Gemini API error: {e}"}
            })
            previous_error = f"Gemini API error: {e}"
            continue

        print(f"  LLM Output: {llm_output}")

        # Step 2: Validate with Evidence Gate
        validation_result = validate_llm_output(llm_output)
        print(f"  Valid: {validation_result['is_valid']}")
        if validation_result["error_details"]:
            print(f"  Error: {validation_result['error_details']}")

        attempts_log.append({
            "attempt_number": attempt,
            "llm_output": llm_output,
            "validation": validation_result,
        })

        # Step 3: Check result
        if validation_result["is_valid"]:
            print(f"\n  [SUCCESS] on attempt {attempt}!")
            return {
                "final_status": "success",
                "attempts": attempts_log,
                "extracted_data": json.loads(llm_output),
            }
        else:
            previous_error = validation_result["error_details"]
            print(f"\n  [FAILED] -- feeding error back to Gemini...")

    # All attempts exhausted
    print(f"\n  [FAILED] after {max_attempts} attempts.")
    return {
        "final_status": "failed",
        "attempts": attempts_log,
        "extracted_data": None,
    }


def _fallback_validator(json_string: str) -> dict:
    """Basic JSON validation fallback when Person 3's code isn't available."""
    try:
        data = json.loads(json_string)
        errors = []
        if "customer_name" not in data or not isinstance(data["customer_name"], str):
            errors.append("customer_name must be a non-empty string")
        if "invoice_amount" not in data or not isinstance(data["invoice_amount"], (int, float)):
            errors.append("invoice_amount must be a number (float)")
        if "date" not in data or not isinstance(data["date"], str):
            errors.append("date must be a string in YYYY-MM-DD format")
        if errors:
            return {"is_valid": False, "error_details": "; ".join(errors)}
        return {"is_valid": True, "error_details": None}
    except json.JSONDecodeError as e:
        return {"is_valid": False, "error_details": f"Invalid JSON: {e}"}


# ---------------------------------------------------------------------------
# Main — run this file directly for a quick demo
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Test with intentionally tricky data (the demo scenario for judges!)
    test_inputs = [
        "Client: John Doe. Amount: One hundred dollars. Date: Tomorrow.",
        "Invoice for Jane Smith, total $250.50, issued on 03/15/2025",
        "hi my name is Bob and I owe you like fifty bucks from last tuesday",
    ]

    for i, text in enumerate(test_inputs, 1):
        print(f"\n{'#'*70}")
        print(f"  TEST CASE {i}: {text}")
        print(f"{'#'*70}")
        result = run_self_healing_extraction(text)
        print(f"\n  Final Status: {result['final_status']}")
        if result["extracted_data"]:
            print(f"  Extracted: {json.dumps(result['extracted_data'], indent=2)}")
        print()
