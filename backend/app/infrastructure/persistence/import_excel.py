"""Validate the entire workbook before a single, atomic PostgreSQL upsert."""
import argparse
import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

import httpx
from openpyxl import load_workbook
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.infrastructure.persistence.schema import TABLES, columns


def read_dataset(path: Path) -> dict[str, list[dict[str, Any]]]:
    workbook = load_workbook(path, read_only=True, data_only=True)
    data: dict[str, list[dict[str, Any]]] = {}
    try:
        for sheet in [*TABLES, "Codigos", "Catalogo"]:
            if sheet in {"Tipos", "Gestiones", "Modalidades", "Niveles"}:
                continue
            rows = iter(workbook[sheet].values)
            headers = next(rows)
            data[sheet] = [
                {str(k): v.date().isoformat() if isinstance(v, datetime)
                 else v.isoformat() if isinstance(v, date) else v
                 for k, v in zip(headers, row, strict=True)}
                for row in rows if any(v is not None for v in row)
            ]
    finally:
        workbook.close()
    for sheet, category in [("Tipos", "tipo"), ("Gestiones", "gestion"),
                            ("Modalidades", "modalidad"), ("Niveles", "nivel")]:
        data[sheet] = [{"codigo_id": r["codigo_id"], "etiqueta": r["etiqueta"]}
                       for r in data["Codigos"] if r["categoria"] == category]
    catalog = {row["oferta_id"]: row for row in data["Catalogo"]}
    if len(catalog) != len(data["Catalogo"]):
        raise ValueError("Catalogo: duplicate oferta_id")
    if set(catalog) != {row["oferta_id"] for row in data["Ofertas"]}:
        raise ValueError("Catalogo and Ofertas must contain the same IDs")
    extra = ["carrera_oficial", "consulta_costos", "ficha_url", "fuente_oferta_url",
             "evidencia_sede", "periodo_fuente"]
    for row in data["Ofertas"]:
        row.update({name: catalog[row["oferta_id"]][name] for name in extra})
    validate_dataset(data)
    return {sheet: [{name: row.get(name) for name in columns(spec[2])} for row in data[sheet]]
            for sheet, spec in TABLES.items()}


def validate_dataset(data: dict[str, list[dict[str, Any]]]) -> None:
    for sheet, (_, key, definition) in TABLES.items():
        rows = data[sheet]
        keys = [row[key] for row in rows]
        if not rows or len(set(keys)) != len(keys):
            raise ValueError(f"{sheet}: empty table or duplicate keys")
        if any(type(value) is not int or value <= 0 for value in keys):
            raise ValueError(f"{sheet}: IDs must be positive integers")
        for clause in definition.split(","):
            parts = clause.strip().split()
            name = parts[0]
            if "not null" in clause.lower() and any(row.get(name) is None for row in rows):
                raise ValueError(f"{sheet}.{name}: missing required value")
            if "references public.orienta_" in clause:
                target_suffix = clause.split("references public.orienta_")[1].split()[0]
                target = next(s for s, spec in TABLES.items() if spec[0] == target_suffix)
                allowed = {row[TABLES[target][1]] for row in data[target]}
                if any(row.get(name) not in allowed for row in rows):
                    raise ValueError(f"{sheet}.{name}: invalid reference")
    campuses = {row["sede_id"]: row for row in data["Sedes"]}
    careers = {row["carrera_id"]: row for row in data["Carreras"]}
    for row in data["Ofertas"]:
        if campuses[row["sede_id"]]["institucion_id"] != row["institucion_id"]:
            raise ValueError("Offer institution does not match campus")
        if careers[row["carrera_id"]]["area_id"] != row["area_id"]:
            raise ValueError("Offer area does not match career")
    if any(row["duracion_valor"] <= 0 for row in data["Duraciones"]):
        raise ValueError("Duration must be positive")


class ImportSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")
    insforge_base_url: str
    insforge_api_key: str


def import_dataset(data: dict[str, Any], settings: ImportSettings) -> None:
    # A function call is one PostgreSQL transaction, including every source table.
    response = httpx.post(
        f"{settings.insforge_base_url}/api/database/advance/rawsql",
        headers={"Authorization": f"Bearer {settings.insforge_api_key}"},
        json={"query": "SELECT public.orienta_import_dataset($1::jsonb)",
              "params": [json.dumps(data)]}, timeout=90,
    )
    if response.is_error:
        raise RuntimeError(f"Import failed (HTTP {response.status_code}); transaction rolled back")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("excel", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    dataset = read_dataset(args.excel)
    print(json.dumps({sheet: len(rows) for sheet, rows in dataset.items()}))
    if args.apply:
        import_dataset(dataset, ImportSettings())
        print("Atomic upsert completed")
