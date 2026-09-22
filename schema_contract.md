// The LLM must output this exact format:
{
  "customer_name": "string",
  "invoice_amount": "float",
  "currency": "string (e.g. USD, EUR)",
  "date": "YYYY-MM-DD",
  "is_paid": "boolean",
  "line_items": ["string", "string"]
}

// The Evidence Gate will return this format to the Agent:
{
  "is_valid": true/false,
  "error_details": "String explaining what the LLM got wrong (if any)"
}