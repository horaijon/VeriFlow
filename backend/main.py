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

    missing_fields = []
    partial_data = None

    if status != "Success":
        # Get the last validation result to extract pydantic errors
        last_attempt = attempts[-1]
        if last_attempt and last_attempt.validation and last_attempt.validation.pydantic_errors:
            for error in last_attempt.validation.pydantic_errors:
                loc = error.get("loc", [])
                if loc:
                    field_name = str(loc[0])
                    missing_fields.append({
                        "field": field_name,
                        "reason": error.get("msg", "Invalid field")
                    })
        
        # Try to extract the best partial data
        if last_attempt and last_attempt.agent_output:
            try:
                gate_result = validate_llm_output(last_attempt.agent_output, model_class=dynamic_model)
                partial_data = gate_result.get("partial_data") or json.loads(last_attempt.agent_output)
            except Exception:
                partial_data = {}
        
        if not partial_data:
            partial_data = {}
            
        status = "needs_clarification"

    return ProcessResponse(
        status=status,
        final_output=final_output,
        missing_fields=missing_fields,
        partial_data=partial_data,
        attempts=attempts,
        total_attempts=len(attempts),
        max_retries=MAX_RETRIES,
    )

from models import ResolveRequest, ResolveResponse

@app.post("/resolve-clarification", response_model=ResolveResponse)
async def resolve_clarification(request: ResolveRequest, user: str = Depends(get_current_user)):
    try:
        use_case_config = get_use_case(request.use_case)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    dynamic_model = build_dynamic_model(use_case_config)
    
    # Merge partial data with user inputs
    merged_data = {**request.partial_data, **request.user_inputs}
    
    try:
        # Final validation
        validated = dynamic_model(**merged_data)
        return ResolveResponse(
            status="resolved",
            final_data=validated.model_dump(mode="json")
        )
    except Exception as exc:
        # If it still fails, return the errors
        if hasattr(exc, "errors"):
            return ResolveResponse(
                status="error",
                final_data=merged_data,
                errors=exc.errors()
            )
        raise HTTPException(status_code=400, detail=str(exc))
