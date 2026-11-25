import logging

import httpx
from pydantic import BaseModel

from app.domain.catalog import ServiceUnavailable

logger = logging.getLogger(__name__)


async def generate_structured[Result: BaseModel](
    client: httpx.AsyncClient,
    model: str,
    instructions: str,
    context: str,
    schema: type[Result],
    error_message: str,
) -> Result:
    try:
        response = await client.post(f"/v1beta/models/{model}:generateContent", json={
            "systemInstruction": {"parts": [{"text": instructions}]},
            "contents": [{"role": "user", "parts": [{"text": context}]}],
            "generationConfig": {
                "temperature": 0.2, "maxOutputTokens": 1800,
                "responseMimeType": "application/json",
                "responseJsonSchema": schema.model_json_schema(),
            },
        })
        response.raise_for_status()
        candidate = response.json()["candidates"][0]
        if candidate.get("finishReason") != "STOP":
            raise ValueError("Incomplete generation")
        text = "".join(part.get("text", "") for part in candidate["content"]["parts"]
                       if not part.get("thought"))
        return schema.model_validate_json(text)
    except httpx.HTTPStatusError as error:
        logger.warning("Gemini generateContent rechazó la solicitud: HTTP %s (modelo %s)",
                       error.response.status_code, model)
        raise ServiceUnavailable(error_message) from error
    except (httpx.HTTPError, IndexError, KeyError, TypeError, ValueError) as error:
        raise ServiceUnavailable(error_message) from error
