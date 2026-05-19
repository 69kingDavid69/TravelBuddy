import httpx
from pydantic import BaseModel, Field
from langchain_core.tools import tool


class CurrencyInput(BaseModel):
    amount: float = Field(description="Amount to convert")
    from_currency: str = Field(description="Source currency ISO 4217 code, e.g. USD")
    to_currency: str = Field(description="Target currency ISO 4217 code, e.g. COP")


@tool("currency_converter", args_schema=CurrencyInput)
def currency_converter(amount: float, from_currency: str, to_currency: str) -> dict:
    """Convert an amount from one currency to another using live exchange rates from open.er-api.com."""
    from_code = from_currency.upper().strip()
    to_code = to_currency.upper().strip()
    url = f"https://open.er-api.com/v6/latest/{from_code}"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if data.get("result") != "success":
        raise ValueError(f"Exchange rate API error: {data.get('error-type', 'unknown')}")
    if to_code not in data["rates"]:
        raise ValueError(f"Currency code not found: {to_code}")
    rate = data["rates"][to_code]
    converted = round(amount * rate, 2)
    return {"converted": converted, "rate": rate, "from": from_code, "to": to_code, "source": "open.er-api.com"}
