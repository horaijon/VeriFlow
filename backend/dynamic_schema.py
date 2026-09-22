from pydantic import create_model, Field, ConfigDict
from typing import Any
import datetime

def build_dynamic_model(use_case: dict):
    """
    Takes a use case dict (from use_cases.py) and returns a dynamically
    created Pydantic model class.
    """
    field_definitions = {}
    
    for field_def in use_case["fields"]:
        python_type = _resolve_type(field_def["type"])
        field_kwargs = {"description": field_def["description"]}
        
        # Add constraints
        constraints = field_def.get("constraints", {})
        for k, v in constraints.items():
            field_kwargs[k] = v
            
        if "default" in field_def:
            field_kwargs["default"] = field_def["default"]
        
        if field_def["required"]:
            if "default" not in field_kwargs:
                field_definitions[field_def["name"]] = (python_type, Field(..., **field_kwargs))
            else:
                field_definitions[field_def["name"]] = (python_type, Field(**field_kwargs))
        else:
            if "default" not in field_kwargs:
                field_definitions[field_def["name"]] = (python_type | None, Field(default=None, **field_kwargs))
            else:
                field_definitions[field_def["name"]] = (python_type, Field(**field_kwargs))
        
        # Add source_quote field if enabled
        if use_case.get("source_quotes"):
            quote_name = f"{field_def['name']}_source_quote"
            field_definitions[quote_name] = (
                str | None,
                Field(default="", description=f"Exact quote from source text proving '{field_def['name']}'")
            )
    
    DynamicModel = create_model(
        f"{use_case['id'].title()}Schema",
        __config__=ConfigDict(extra='forbid', str_strip_whitespace=True),
        **field_definitions
    )
    
    return DynamicModel

def _resolve_type(type_str: str):
    mapping = {
        "str": str,
        "int": int,
        "float": float,
        "bool": bool,
        "list[str]": list[str],
        "date": str,  # Keep as string for simpler validation
    }
    return mapping.get(type_str, str)

def get_schema_display(use_case: dict) -> dict:
    """
    Returns a JSON-friendly representation of the schema for the frontend
    to display in the sidebar.
    """
    fields = {}
    for f in use_case["fields"]:
        type_label = f["type"]
        if not f["required"]:
            type_label += " (optional)"
        fields[f["name"]] = type_label
        if use_case.get("source_quotes"):
            fields[f"{f['name']}_source_quote"] = "str (auto-generated proof)"
    return fields
