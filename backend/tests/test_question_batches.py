import asyncio
import json

import httpx
import pytest

from app.domain.catalog import ServiceUnavailable
from app.infrastructure.ai.preparation import PreparationContext, prepare_questions


def generate(questions, *, count=3, excluded=None):
    requests = []
    def respond(request):
        requests.append(json.loads(request.content))
        return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps({"questions": questions, "summary": ""})}]}}]})
    async def run():
        async with httpx.AsyncClient(base_url="https://example.test", transport=httpx.MockTransport(respond)) as client:
            result = await prepare_questions(client, "test-model", PreparationContext(offers=[], comparisons=[], questions=[], question_count=count, exclude_questions=excluded or []))
            return result, requests[0]
    return asyncio.run(run())


def test_batch_requires_exactly_three_questions():
    result, request = generate(["Pregunta uno", "Pregunta dos", "Pregunta tres"])
    assert len(result.questions) == 3
    schema = request["generationConfig"]["responseJsonSchema"]["properties"]["questions"]
    assert schema["minItems"] == schema["maxItems"] == 3


@pytest.mark.parametrize("questions", [["Una", "Dos"], ["Una", "Una", "Tres"], ["Anterior", "Dos", "Tres"]])
def test_batch_rejects_missing_duplicate_or_previous_questions(questions):
    with pytest.raises(ServiceUnavailable):
        generate(questions, excluded=["Anterior"])


def test_conversation_keeps_existing_flexible_question_count():
    result, _ = generate(["Una pregunta"], count=None)
    assert result.questions == ["Una pregunta"]
