from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints, UUID4, model_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1600)]
State = Literal["recibida", "confirmada", "respondida", "rechazada"]


class Slot(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    starts_at: AwareDatetime


class Advisor(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: Text
    focus: Text
    conditions: Text
    response_window: Text
    active: bool = True
    accepts_text: bool = False
    slots: list[Slot] = Field(default_factory=list)

    @model_validator(mode="after")
    def unique_slots(self) -> "Advisor":
        if len({slot.id for slot in self.slots}) != len(self.slots):
            raise ValueError("Los identificadores de horarios deben ser únicos.")
        return self


class RequestInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    request_id: UUID4
    advisor_id: str = Field(min_length=1, max_length=80)
    channel: Literal["zoom", "texto"]
    contact: str = Field(min_length=3, max_length=160, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    slot_id: str | None = Field(default=None, max_length=80)
    question: Text | None = None
    consent: bool = False
    summary: Text | None = None

    @model_validator(mode="after")
    def validate_channel_and_consent(self) -> "RequestInput":
        if self.channel == "zoom" and (not self.slot_id or self.question is not None):
            raise ValueError("Selecciona un horario para Zoom.")
        if self.channel == "texto" and (not self.question or self.slot_id is not None):
            raise ValueError("Escribe la pregunta para el orientador.")
        if bool(self.summary) != self.consent:
            raise ValueError("Compartir el resumen requiere autorización explícita.")
        return self


class Receipt(BaseModel):
    id: UUID
    channel: Literal["zoom", "texto"]
    status: State
    starts_at: datetime | None
    response_window: str
    response: str | None = None
    meeting_url: str | None = None
