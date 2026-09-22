USE_CASES = {
    "invoice": {
        "id": "invoice",
        "name": "Invoice Extraction",
        "description": "Extract structured data from an invoice.",
        "fields": [
            {"name": "customer_name", "type": "str", "required": True, "description": "The customer or client name", "constraints": {"min_length": 1}},
            {"name": "invoice_amount", "type": "float", "required": True, "description": "Numeric dollar amount, no currency symbols", "constraints": {"gt": 0}},
            {"name": "currency", "type": "str", "required": False, "description": "3-letter currency code", "constraints": {"min_length": 3, "max_length": 3}, "default": "USD"},
            {"name": "date", "type": "date", "required": True, "description": "Date in YYYY-MM-DD format"},
            {"name": "is_paid", "type": "bool", "required": True, "description": "True if paid, false otherwise"},
            {"name": "line_items", "type": "list[str]", "required": False, "description": "List of purchased items"}
        ],
        "sample_text": "Client: John Doe. Amount: One hundred dollars. Date: Tomorrow.",
        "source_quotes": True,
    },
    "hr_resume": {
        "id": "hr_resume",
        "name": "HR Resume Extraction",
        "description": "Extract structured data from a resume.",
        "fields": [
            {"name": "candidate_name", "type": "str", "required": True, "description": "The candidate's full name", "constraints": {"min_length": 1}},
            {"name": "email", "type": "str", "required": True, "description": "Email address", "constraints": {"pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$"}},
            {"name": "years_of_experience", "type": "int", "required": True, "description": "Total years of experience", "constraints": {"ge": 0}},
            {"name": "skills", "type": "list[str]", "required": True, "description": "List of skills"},
            {"name": "education_level", "type": "str", "required": True, "description": "Highest education level (High School/Bachelors/Masters/PhD)"},
            {"name": "desired_salary", "type": "float", "required": False, "description": "Desired salary in dollars", "constraints": {"gt": 0}}
        ],
        "sample_text": "My name is Sarah Chen, email sarah.chen@gmail.com. I have about 5 years working in Python, React, and AWS. Got my Masters from MIT. Looking for around 150k.",
        "source_quotes": True,
    },
    "clinical_note": {
        "id": "clinical_note",
        "name": "Clinical Note Extraction",
        "description": "Extract structured data from a clinical note.",
        "fields": [
            {"name": "patient_name", "type": "str", "required": True, "description": "The patient's name", "constraints": {"min_length": 1}},
            {"name": "age", "type": "int", "required": True, "description": "Patient age in years", "constraints": {"gt": 0}},
            {"name": "diagnosis", "type": "str", "required": True, "description": "Primary diagnosis"},
            {"name": "medications", "type": "list[str]", "required": True, "description": "List of medications"},
            {"name": "follow_up_date", "type": "date", "required": True, "description": "Follow-up date in YYYY-MM-DD format"},
            {"name": "is_urgent", "type": "bool", "required": True, "description": "True if the case is urgent"}
        ],
        "sample_text": "Pt: Mary Johnson, 67yo female. Dx: Type 2 diabetes with peripheral neuropathy. Currently on Metformin 500mg bid and Gabapentin 300mg tid. Needs follow-up in 2 weeks. Non-urgent.",
        "source_quotes": True,
    },
    "legal_contract": {
        "id": "legal_contract",
        "name": "Legal Contract Extraction",
        "description": "Extract structured data from a legal contract.",
        "fields": [
            {"name": "party_a", "type": "str", "required": True, "description": "First party involved", "constraints": {"min_length": 1}},
            {"name": "party_b", "type": "str", "required": True, "description": "Second party involved", "constraints": {"min_length": 1}},
            {"name": "contract_type", "type": "str", "required": True, "description": "Type of contract"},
            {"name": "effective_date", "type": "date", "required": True, "description": "Effective date in YYYY-MM-DD format"},
            {"name": "termination_date", "type": "date", "required": True, "description": "Termination date in YYYY-MM-DD format"},
            {"name": "total_value", "type": "float", "required": True, "description": "Total monetary value of the contract", "constraints": {"gt": 0}},
            {"name": "governing_law", "type": "str", "required": True, "description": "Governing law jurisdiction"}
        ],
        "sample_text": "This Service Agreement is entered into between Acme Corp ('Client') and TechServ LLC ('Provider'), effective March 1, 2025, terminating December 31, 2025. Total contract value is $240,000. Governed by the laws of Delaware.",
        "source_quotes": True,
    },
}

def get_use_case(use_case_id: str) -> dict:
    if use_case_id not in USE_CASES:
        raise ValueError(f"Unknown use case: {use_case_id}. Available: {list(USE_CASES.keys())}")
    return USE_CASES[use_case_id]

def get_all_use_cases() -> list[dict]:
    return [{"id": uc["id"], "name": uc["name"], "description": uc["description"]} for uc in USE_CASES.values()]
