"""
test_gate.py  –  Comprehensive tests for the Evidence Gate.

Run with:   python -m pytest evidence/test_gate.py -v
"""

from evidence.gate import validate_llm_output


# ================================================================== #
#  HAPPY PATH – Valid outputs the LLM might produce
# ================================================================== #

class TestValidOutputs:

    def test_perfect_json(self):
        """Textbook-correct output."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 1500.00, "date": "2024-03-15"}'
        )
        assert result["is_valid"] is True
        assert result["error_details"] is None
        assert result["parsed_data"]["customer_name"] == "Acme Corp"
        assert result["parsed_data"]["invoice_amount"] == 1500.0
        assert result["parsed_data"]["date"] == "2024-03-15"

    def test_amount_as_integer(self):
        """LLM returns amount as int (1500 instead of 1500.0)."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 1500, "date": "2024-03-15"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["invoice_amount"] == 1500.0

    def test_amount_with_currency_symbol(self):
        """LLM includes a dollar sign in the amount."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": "$1,234.56", "date": "2024-03-15"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["invoice_amount"] == 1234.56

    def test_us_date_format(self):
        """LLM returns MM/DD/YYYY instead of ISO."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100, "date": "03/15/2024"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["date"] == "2024-03-15"

    def test_long_form_date(self):
        """LLM returns 'January 15, 2024' style date."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100, "date": "January 15, 2024"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["date"] == "2024-01-15"

    def test_datetime_string(self):
        """LLM returns a full datetime string."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100, "date": "2024-01-15T00:00:00"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["date"] == "2024-01-15"

    def test_whitespace_in_name_is_stripped(self):
        """LLM has leading/trailing spaces in name."""
        result = validate_llm_output(
            '{"customer_name": "  Acme Corp  ", "invoice_amount": 100, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["customer_name"] == "Acme Corp"


# ================================================================== #
#  FAILURE PATH – Invalid outputs the LLM might hallucinate
# ================================================================== #

class TestInvalidOutputs:

    def test_not_json_at_all(self):
        """LLM returns plain text instead of JSON."""
        result = validate_llm_output("Here is the invoice data for Acme Corp")
        assert result["is_valid"] is False
        assert "not valid JSON" in result["error_details"]

    def test_json_wrapped_in_markdown(self):
        """LLM wraps JSON in ```json``` code fences — gate strips them."""
        result = validate_llm_output(
            '```json\n{"customer_name": "Acme Corp", "invoice_amount": 100, "date": "2024-01-15"}\n```'
        )
        assert result["is_valid"] is True
        assert result["parsed_data"]["customer_name"] == "Acme Corp"

    def test_json_array_instead_of_object(self):
        """LLM returns a list instead of an object."""
        result = validate_llm_output('[{"customer_name": "X"}]')
        assert result["is_valid"] is False
        assert "JSON object" in result["error_details"]

    def test_missing_customer_name(self):
        """LLM omits customer_name entirely."""
        result = validate_llm_output(
            '{"invoice_amount": 100, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "customer_name" in result["error_details"]

    def test_missing_invoice_amount(self):
        """LLM omits invoice_amount."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "invoice_amount" in result["error_details"]

    def test_missing_date(self):
        """LLM omits the date."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100}'
        )
        assert result["is_valid"] is False
        assert "date" in result["error_details"]

    def test_negative_amount(self):
        """LLM returns a negative invoice amount."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": -50, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "invoice_amount" in result["error_details"]

    def test_zero_amount(self):
        """LLM returns zero for the amount."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 0, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "invoice_amount" in result["error_details"]

    def test_placeholder_name(self):
        """LLM fills in 'string' as customer name (the schema example)."""
        result = validate_llm_output(
            '{"customer_name": "string", "invoice_amount": 100, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "placeholder" in result["error_details"]

    def test_empty_name(self):
        """LLM returns an empty customer name."""
        result = validate_llm_output(
            '{"customer_name": "", "invoice_amount": 100, "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "customer_name" in result["error_details"]

    def test_unparseable_date(self):
        """LLM returns a gibberish date."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100, "date": "next Tuesday"}'
        )
        assert result["is_valid"] is False
        assert "date" in result["error_details"]

    def test_hallucinated_extra_field(self):
        """LLM invents a field not in the schema."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": 100, '
            '"date": "2024-01-15", "tax_rate": 0.15}'
        )
        assert result["is_valid"] is False
        assert "error_details" in result  # extra field rejected

    def test_amount_as_non_numeric_string(self):
        """LLM returns 'one hundred' instead of a number."""
        result = validate_llm_output(
            '{"customer_name": "Acme Corp", "invoice_amount": "one hundred", "date": "2024-01-15"}'
        )
        assert result["is_valid"] is False
        assert "invoice_amount" in result["error_details"]

    def test_none_input(self):
        """Edge case: None passed in."""
        result = validate_llm_output(None)
        assert result["is_valid"] is False
        assert "not valid JSON" in result["error_details"]

    def test_empty_string(self):
        """Edge case: empty string."""
        result = validate_llm_output("")
        assert result["is_valid"] is False
        assert "not valid JSON" in result["error_details"]

    def test_multiple_errors_at_once(self):
        """LLM gets every field wrong — all errors reported."""
        result = validate_llm_output(
            '{"customer_name": "", "invoice_amount": -1, "date": "nope"}'
        )
        assert result["is_valid"] is False
        # Should mention multiple field issues.
        assert result["error_details"].count("•") >= 2
