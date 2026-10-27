"""Render the initial additive migration; never run against an existing database."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.infrastructure.persistence.schema import TABLES, columns  # noqa: E402

sql = ["-- ORIENTA: additive schema on an empty application database."]
upserts = []
for sheet, (suffix, key, definition) in TABLES.items():
    table = f"public.orienta_{suffix}"
    sql += [f"CREATE TABLE {table} ({definition});",
            f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;",
            f"REVOKE ALL ON {table} FROM anon, authenticated;"]
    names = columns(definition)
    updates = ", ".join(f"{name}=EXCLUDED.{name}" for name in names if name != key)
    upserts.append(
        f"INSERT INTO {table} ({', '.join(names)}) SELECT {', '.join(names)} "
        f"FROM jsonb_populate_recordset(NULL::{table}, payload->'{sheet}') "
        f"ON CONFLICT ({key}) DO UPDATE SET {updates};"
    )
sql += [
    "ALTER TABLE public.orienta_sedes ADD UNIQUE(sede_id, institucion_id);",
    "ALTER TABLE public.orienta_ofertas ADD FOREIGN KEY(sede_id, institucion_id) REFERENCES public.orienta_sedes(sede_id, institucion_id);",
    "ALTER TABLE public.orienta_carreras ADD UNIQUE(carrera_id, area_id);",
    "ALTER TABLE public.orienta_ofertas ADD FOREIGN KEY(carrera_id, area_id) REFERENCES public.orienta_carreras(carrera_id, area_id);",
    "CREATE INDEX orienta_oferta_filtros ON public.orienta_ofertas(modalidad_id, institucion_id, carrera_id);",
    "CREATE INDEX orienta_sedes_distrito ON public.orienta_sedes(distrito_id);",
    "CREATE INDEX orienta_carrera_nombre ON public.orienta_carreras(lower(nombre_catalogado));",
    "CREATE FUNCTION public.orienta_import_dataset(payload jsonb) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$ BEGIN " + "\n".join(upserts) + " END $$;",
    "REVOKE ALL ON FUNCTION public.orienta_import_dataset(jsonb) FROM PUBLIC, anon, authenticated;",
    """CREATE VIEW public.orienta_catalogo AS
SELECT o.*, i.nombre AS institucion, i.tipo_id, t.etiqueta AS tipo,
 i.gestion_id, g.etiqueta AS gestion, i.web_url AS institucion_url,
 s.nombre_sede AS sede, s.distrito_id, d.distrito, s.direccion, s.alcance_del_local,
 c.nombre_catalogado, c.enfoque_editorial, c.ambitos_editoriales, c.criterio_clasificacion,
 a.nombre_area AS area, m.etiqueta AS modalidad, n.etiqueta AS nivel,
 du.duracion_valor, du.unidad AS duracion_unidad,
 lower(translate(o.carrera_oficial || ' ' || i.nombre || ' ' || d.distrito || ' ' || a.nombre_area,
 'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')) AS busqueda
FROM public.orienta_ofertas o
JOIN public.orienta_instituciones i USING(institucion_id)
JOIN public.orienta_tipos t ON t.codigo_id=i.tipo_id
JOIN public.orienta_gestiones g ON g.codigo_id=i.gestion_id
JOIN public.orienta_sedes s ON s.sede_id=o.sede_id
JOIN public.orienta_distritos d ON d.distrito_id=s.distrito_id
JOIN public.orienta_carreras c ON c.carrera_id=o.carrera_id
JOIN public.orienta_areas a ON a.area_id=o.area_id
JOIN public.orienta_modalidades m ON m.codigo_id=o.modalidad_id
JOIN public.orienta_niveles n ON n.codigo_id=o.nivel_id
LEFT JOIN public.orienta_duraciones du USING(oferta_id);""",
    "REVOKE ALL ON public.orienta_catalogo FROM anon, authenticated;",
]
destination = Path(__file__).resolve().parents[1] / "migrations/20261027004100_orienta-catalogo.sql"
destination.write_text("\n\n".join(sql) + "\n", encoding="utf-8")
print(destination.name)
