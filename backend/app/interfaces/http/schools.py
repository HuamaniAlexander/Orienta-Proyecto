import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api/colegios", tags=["colegios"])

SCHOOL_SCHEMA = """
CREATE TABLE IF NOT EXISTS school_inquiries (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    school_name TEXT NOT NULL,
    district TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    tier_cupos INTEGER NOT NULL,
    period_months INTEGER NOT NULL,
    total_pen INTEGER NOT NULL,
    notes TEXT
);
"""

PRICING_MATRIX: dict[int, dict[int, int]] = {
    100: {1: 200, 3: 540, 6: 1020, 12: 1800},
    200: {1: 300, 3: 810, 6: 1530, 12: 2700},
    500: {1: 450, 3: 1215, 6: 2295, 12: 4050},
    1000: {1: 650, 3: 1755, 6: 3315, 12: 5850},
}

DISCOUNTS: dict[int, int] = {1: 0, 3: 10, 6: 15, 12: 25}


class SchoolInquiryInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    school_name: str = Field(min_length=2, max_length=160)
    district: str = Field(min_length=2, max_length=100)
    contact_name: str = Field(min_length=2, max_length=120)
    contact_email: str = Field(min_length=5, max_length=160, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    contact_phone: str | None = Field(default=None, max_length=30)
    tier_cupos: Literal[100, 200, 500, 1000] = 100
    period_months: Literal[1, 3, 6, 12] = 12
    notes: str | None = Field(default=None, max_length=1000)


class SchoolInquiryReceipt(BaseModel):
    id: UUID
    created_at: str
    school_name: str
    tier_cupos: int
    period_months: int
    total_pen: int
    monthly_equivalent_pen: float
    per_student_pen: float
    discount_percent: int
    status: str = "recibida"


def _connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=5)
    conn.execute(SCHOOL_SCHEMA)
    return conn


@router.get("/planes")
def list_plans() -> dict[str, object]:
    return {
        "currency": "PEN",
        "discounts": DISCOUNTS,
        "tiers": [
            {
                "cupos": cupos,
                "prices": prices,
                "annual_per_student": round(prices[12] / cupos, 2),
                "annual_monthly_ref": round(prices[12] / 12, 2),
            }
            for cupos, prices in PRICING_MATRIX.items()
        ],
    }


@router.post("/solicitudes", response_model=SchoolInquiryReceipt, status_code=201)
def create_school_inquiry(payload: SchoolInquiryInput, request: Request) -> SchoolInquiryReceipt:
    inquiry_id = uuid4()
    created_at = datetime.now(UTC).isoformat()
    total_pen = PRICING_MATRIX[payload.tier_cupos][payload.period_months]
    db_path: Path = request.app.state.schools_db_path
    with _connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO school_inquiries (
                id, created_at, school_name, district, contact_name, contact_email,
                contact_phone, tier_cupos, period_months, total_pen, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(inquiry_id),
                created_at,
                payload.school_name,
                payload.district,
                payload.contact_name,
                payload.contact_email,
                payload.contact_phone,
                payload.tier_cupos,
                payload.period_months,
                total_pen,
                payload.notes,
            ),
        )
    return SchoolInquiryReceipt(
        id=inquiry_id,
        created_at=created_at,
        school_name=payload.school_name,
        tier_cupos=payload.tier_cupos,
        period_months=payload.period_months,
        total_pen=total_pen,
        monthly_equivalent_pen=round(total_pen / payload.period_months, 2),
        per_student_pen=round(total_pen / payload.tier_cupos, 2),
        discount_percent=DISCOUNTS[payload.period_months],
    )
