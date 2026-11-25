import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.infrastructure.orientation.store import OrientationStore
from app.infrastructure.settings import Settings
from app.main import create_app


def test_orientation_keeps_consent_and_prevents_double_booking(tmp_path: Path) -> None:
    profiles = tmp_path / "profiles.json"
    database = tmp_path / "requests.sqlite3"
    profiles.write_text(json.dumps([{
        "id": "advisor", "name": "Perfil de prueba", "focus": "Carreras",
        "conditions": "Servicio de prueba", "response_window": "Dos días hábiles",
        "accepts_text": True, "slots": [
            {"id": "morning", "starts_at": (datetime.now(UTC) + timedelta(days=1)).isoformat()},
        ],
    }]))
    api = create_app(Settings(orientation_db_path=database, orientation_profiles_path=profiles))
    base = "/api/orientacion"
    booking = {
        "request_id": str(uuid4()), "advisor_id": "advisor",
        "contact": "student@example.com", "channel": "zoom", "slot_id": "morning",
    }
    with TestClient(api) as client:
        assert len(client.get(f"{base}/orientadores").json()[0]["slots"]) == 1
        invalid = client.post(f"{base}/solicitudes", json={**booking, "summary": "Privado"})
        assert invalid.status_code == 422
        result = client.post(f"{base}/solicitudes", json=booking)
        assert result.status_code == 201
        assert result.json()["status"] == "recibida"
        assert client.post(f"{base}/solicitudes", json=booking).json() == result.json()
        conflict = client.post(f"{base}/solicitudes", json={**booking, "request_id": str(uuid4())})
        assert conflict.status_code == 409
        assert client.get(f"{base}/orientadores").json()[0]["slots"] == []

        store = OrientationStore(database, profiles)
        item = store.inbox("advisor")[0]
        assert item["summary"] is None
        assert store.resolve("advisor", UUID(result.json()["id"]), "confirmada",
                             "https://us02web.zoom.us/j/123456789")
        confirmed = client.get(f"{base}/solicitudes/{booking['request_id']}")
        assert confirmed.json()["status"] == "confirmada"
        assert confirmed.json()["meeting_url"].endswith("/123456789")
        assert "contact" not in confirmed.json()

        question_id = uuid4()
        text = client.post(f"{base}/solicitudes", json={
            "request_id": str(question_id), "advisor_id": "advisor", "channel": "texto",
            "contact": "student@example.com", "question": "¿Qué conviene revisar?",
            "summary": "Resumen autorizado", "consent": True,
        })
        assert text.status_code == 201
        assert text.json()["response_window"] == "Dos días hábiles"
        assert store.inbox("advisor")[0]["summary"] == "Resumen autorizado"
        assert store.resolve("advisor", question_id, "respondida", "Revisa la malla curricular.")
        answered = client.get(f"{base}/solicitudes/{question_id}")
        assert answered.json()["response"] == "Revisa la malla curricular."
