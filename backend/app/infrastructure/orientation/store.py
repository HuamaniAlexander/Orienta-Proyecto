import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlsplit
from uuid import UUID

from pydantic import TypeAdapter

from app.application.orientation import Advisor, Receipt, RequestInput, State
from app.infrastructure.orientation.zoom import ZoomProvisioner

SCHEMA = """
CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    advisor_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'recibida',
    starts_at TEXT,
    response_window TEXT NOT NULL,
    contact TEXT NOT NULL,
    slot_id TEXT,
    question TEXT,
    summary TEXT,
    consent INTEGER NOT NULL,
    payload TEXT NOT NULL,
    response TEXT,
    meeting_url TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS active_slot
ON requests(advisor_id, starts_at)
WHERE starts_at IS NOT NULL AND status != 'rechazada';
"""


class SlotUnavailable(Exception):
    pass


class UnknownAdvisor(Exception):
    pass


class DuplicateRequest(Exception):
    pass


class OrientationStore:
    def __init__(
        self,
        path: Path,
        profiles: Path | list[Advisor],
        *,
        auto_confirm_zoom: bool = False,
        zoom_provisioner: ZoomProvisioner | None = None,
    ):
        self.path = path
        self.auto_confirm_zoom = auto_confirm_zoom
        self.zoom_provisioner = zoom_provisioner or ZoomProvisioner()
        advisors: list[Advisor] = (
            TypeAdapter(list[Advisor]).validate_json(profiles.read_text(encoding="utf-8"))
            if isinstance(profiles, Path)
            else profiles
        )
        self.advisors = {advisor.id: advisor for advisor in advisors if advisor.active}
        if len({advisor.id for advisor in advisors}) != len(advisors):
            raise ValueError("Los identificadores de orientadores deben ser únicos.")
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.touch(mode=0o600, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def list_advisors(self) -> list[Advisor]:
        with self.connect() as connection:
            reserved = {(row["advisor_id"], row["starts_at"]) for row in connection.execute(
                "SELECT advisor_id, starts_at FROM requests WHERE status != 'rechazada' AND starts_at IS NOT NULL"
            )}
        now = datetime.now(UTC)
        return [advisor.model_copy(update={
            "slots": [slot for slot in advisor.slots if slot.starts_at > now
                      and (advisor.id, slot.starts_at.astimezone(UTC).isoformat()) not in reserved],
        }) for advisor in self.advisors.values()]

    def submit(self, request: RequestInput) -> Receipt:
        payload = request.model_dump_json()
        request_id = str(request.request_id)
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute("SELECT * FROM requests WHERE id = ?", (request_id,)).fetchone()
            if existing:
                # Keep retries idempotent even if the slot was subsequently removed.
                if existing["payload"] != payload:
                    raise DuplicateRequest
                return self.receipt(existing)
            advisor = self.advisors.get(request.advisor_id)
            if advisor is None or (request.channel == "texto" and not advisor.accepts_text):
                raise UnknownAdvisor
            slot = next((entry for entry in advisor.slots if entry.id == request.slot_id), None)
            if request.channel == "zoom" and (slot is None or slot.starts_at <= datetime.now(UTC)):
                raise SlotUnavailable
            starts_at = slot.starts_at.astimezone(UTC).isoformat() if slot else None
            status: State = "recibida"
            meeting_url: str | None = None
            if request.channel == "zoom" and self.auto_confirm_zoom and slot is not None:
                status = "confirmada"
                meeting_url = self.zoom_provisioner.create_meeting(
                    request.request_id,
                    f"Orientación ORIENTA · {advisor.name} ({advisor.focus})",
                    slot.starts_at.astimezone(UTC),
                    advisor.duration_minutes or 30,
                )
            try:
                row = connection.execute("""
                    INSERT INTO requests (
                        id, advisor_id, channel, status, starts_at, response_window, contact,
                        slot_id, question, summary, consent, payload, meeting_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
                """, (request_id, advisor.id, request.channel, status, starts_at, advisor.response_window,
                      request.contact, request.slot_id, request.question, request.summary,
                      request.consent, payload, meeting_url)).fetchone()
            except sqlite3.IntegrityError as error:
                raise SlotUnavailable from error
            return self.receipt(row)

    def receipt(self, row: sqlite3.Row) -> Receipt:
        advisor = self.advisors.get(row["advisor_id"])
        return Receipt.model_validate({
            **dict(row),
            "advisor_name": advisor.name if advisor else None,
            "advisor_focus": advisor.focus if advisor else None,
            "advisor_photo_url": advisor.photo_url if advisor else None,
            "guide_shared": bool(row["consent"]),
        })

    def get_receipt(self, request_id: UUID) -> Receipt | None:
        with self.connect() as connection:
            row = connection.execute("SELECT * FROM requests WHERE id = ?", (str(request_id),)).fetchone()
            return self.receipt(row) if row else None

    def inbox(self, advisor_id: str) -> list[dict[str, object]]:
        with self.connect() as connection:
            return [dict(row) for row in connection.execute("""
                SELECT id, channel, status, starts_at, contact, question, summary
                FROM requests WHERE advisor_id = ? AND status = 'recibida' ORDER BY rowid
            """, (advisor_id,))]

    def resolve(self, advisor_id: str, request_id: UUID, status: State, message: str | None) -> bool:
        url = urlsplit(message or "")
        if status == "confirmada" and (
            url.scheme != "https" or url.username or url.password or not url.hostname
            or not (url.hostname == "zoom.us" or url.hostname.endswith(".zoom.us"))
        ):
            raise ValueError("La confirmación requiere un enlace HTTPS de Zoom.")
        if status == "respondida" and not (message and message.strip()):
            raise ValueError("La respuesta no puede estar vacía.")
        if status == "recibida":
            raise ValueError("Elige un estado de atención.")
        channel = {"confirmada": "zoom", "respondida": "texto"}.get(status)
        with self.connect() as connection:
            result = connection.execute("""
                UPDATE requests SET status = ?, response = ?, meeting_url = ?
                WHERE id = ? AND advisor_id = ? AND status = 'recibida' AND (? IS NULL OR channel = ?)
            """, (status, message if status != "confirmada" else None,
                  message if status == "confirmada" else None, str(request_id),
                  advisor_id, channel, channel))
            return result.rowcount == 1
