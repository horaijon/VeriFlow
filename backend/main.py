from __future__ import annotations

import json
import logging
import random
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import (
    AttemptRecord,
    ProcessRequest,
    ProcessResponse,
    ValidationResult,
)
from agent_logic import call_gemini, build_schema_prompt
from gate import validate_llm_output
from use_cases import get_use_case, get_all_use_cases
from dynamic_schema import build_dynamic_model, get_schema_display
from database import init_db, store_otp, verify_and_delete_otp
from auth import send_email, create_access_token, get_current_user

# ── Logging ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("orchestrator")

# Initialize Auth DB
init_db()

# ── FastAPI App ─────────────────────────────────────────────────────
app = FastAPI(
    title="Zero-Trust Data Validator",
    description="Self-healing data extraction pipeline with Dynamic Schemas and OTP Auth.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_RETRIES = 5

@app.get("/health")
async def health():
    return {"status": "healthy"}

# ── Auth Endpoints ──────────────────────────────────────────────────
class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

@app.post("/auth/request-otp")
async def request_otp(req: OTPRequest):
    otp = str(random.randint(100000, 999999))
    store_otp(req.email, otp)
    send_email(req.email, otp)
    return {"message": "OTP sent"}

@app.post("/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    if verify_and_delete_otp(req.email, req.otp):
        token = create_access_token({"sub": req.email})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid or expired OTP")


# ── Protected Endpoints ─────────────────────────────────────────────
@app.get("/use-cases")
async def list_use_cases(user: str = Depends(get_current_user)):
    return get_all_use_cases()

@app.get("/schema/{use_case_id}")
async def get_schema(use_case_id: str, user: str = Depends(get_current_user)):
    try:
        use_case = get_use_case(use_case_id)
        return get_schema_display(use_case)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/process-data", response_model=ProcessResponse)
async def process_data(request: ProcessRequest, user: str = Depends(get_current_user)):
    raw_text = request.raw_text
    try:
        use_case_config = get_use_case(request.use_case)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    dynamic_model = build_dynamic_model(use_case_config)
    schema_prompt = build_schema_prompt(use_case_config)
    
    log.info("─" * 60)
    log.info("New request received by %s", user)
    
    attempts: list[AttemptRecord] = []
    previous_error: str | None = None
    final_output: dict | None = None
    status = f"Failed after {MAX_RETRIES} retries"

    for attempt_num in range(1, MAX_RETRIES + 1):
        log.info("── Attempt %d / %d ──", attempt_num, MAX_RETRIES)
        try:
            agent_output_raw = call_gemini(
                raw_text=raw_text,
                attempt_number=attempt_num,
                previous_error=previous_error,
                schema_description=schema_prompt,
            )
        except Exception as exc:
            attempts.append(
                AttemptRecord(
                    attempt_number=attempt_num,
                    agent_output=None,
                    validation=ValidationResult(is_valid=False, error_details=f"Agent error: {exc}"),
                )
            )
            previous_error = str(exc)
            continue

        try:
            validation_result = validate_llm_output(agent_output_raw, model_class=dynamic_model)
        except Exception as exc:
            validation_result = {"is_valid": False, "error_details": f"Evidence Gate error: {exc}"}

        validation = ValidationResult(**validation_result)
        attempts.append(AttemptRecord(attempt_number=attempt_num, agent_output=agent_output_raw, validation=validation))

        if validation.is_valid:
            status = "Success"
            final_output = validation_result.get("parsed_data") or {}
            break
        else:
            previous_error = validation.error_details

    SCHEMA_FIELDS = {}
    for f in use_case_config["fields"]:
        if f["type"] == "list[str]":
            SCHEMA_FIELDS[f["name"]] = []
        elif f.get("default") is not None:
            SCHEMA_FIELDS[f["name"]] = f["default"]
        else:
            SCHEMA_FIELDS[f["name"]] = None
        if use_case_config.get("source_quotes"):
            SCHEMA_FIELDS[f"{f['name']}_source_quote"] = ""

    fields_needing_review: list[str] = []

    if status != "Success":
        best_partial: dict = {}
        for att in reversed(attempts):
            if att.agent_output:
                try:
                    gate_result = validate_llm_output(att.agent_output)
                    if gate_result.get("parsed_data"):
                        best_partial = gate_result["parsed_data"]
                        break
                    elif gate_result.get("partial_data"):
                        best_partial = gate_result["partial_data"]
                        break
                    else:
                        parsed = json.loads(att.agent_output)
                        if isinstance(parsed, dict):
                            best_partial = parsed
                            break
                except Exception:
                    continue

        merged_output: dict = {}
        for field, default_val in SCHEMA_FIELDS.items():
            if field in best_partial and best_partial[field] not in (None, "", []):
                merged_output[field] = best_partial[field]
            else:
                merged_output[field] = default_val
                fields_needing_review.append(field)

        final_output = merged_output
        status = "Requires Human Review"

    return ProcessResponse(
        status=status,
        final_output=final_output,
        fields_needing_review=fields_needing_review,
        attempts=attempts,
        total_attempts=len(attempts),
        max_retries=MAX_RETRIES,
    )
