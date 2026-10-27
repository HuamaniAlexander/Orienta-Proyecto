"""Application-owned schema and the exact source columns preserved from the workbook."""

TABLES = {
    "Fuentes": ("fuentes", "fuente_id", "fuente_id integer primary key, emisor_tipo text not null, url text not null, fecha_o_periodo_fuente text, fecha_consulta date not null"),
    "Distritos": ("distritos", "distrito_id", "distrito_id integer primary key, distrito text not null, provincia text, departamento text, pais text"),
    "Areas": ("areas", "area_id", "area_id integer primary key, nombre_area text not null"),
    "Tipos": ("tipos", "codigo_id", "codigo_id integer primary key, etiqueta text not null"),
    "Gestiones": ("gestiones", "codigo_id", "codigo_id integer primary key, etiqueta text not null"),
    "Modalidades": ("modalidades", "codigo_id", "codigo_id integer primary key, etiqueta text not null"),
    "Niveles": ("niveles", "codigo_id", "codigo_id integer primary key, etiqueta text not null"),
    "Instituciones": ("instituciones", "institucion_id", "institucion_id integer primary key, nombre text not null, tipo_id integer not null references public.orienta_tipos, gestion_id integer not null references public.orienta_gestiones, web_url text, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null"),
    "Sedes": ("sedes", "sede_id", "sede_id integer primary key, institucion_id integer not null references public.orienta_instituciones, nombre_sede text not null, distrito_id integer not null references public.orienta_distritos, distrito text, direccion text, alcance_del_local text, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null"),
    "Carreras": ("carreras", "carrera_id", "carrera_id integer primary key, nombre_catalogado text not null, area_id integer not null references public.orienta_areas, area_editorial text, enfoque_editorial text, ambitos_editoriales text, criterio_clasificacion text"),
    "Ofertas": ("ofertas", "oferta_id", "oferta_id integer primary key, institucion_id integer not null references public.orienta_instituciones, sede_id integer not null references public.orienta_sedes, carrera_id integer not null references public.orienta_carreras, area_id integer not null references public.orienta_areas, nivel_id integer not null references public.orienta_niveles, modalidad_id integer not null references public.orienta_modalidades, fuente_oferta_id integer not null references public.orienta_fuentes, fuente_ficha_id integer not null references public.orienta_fuentes, fecha_consulta date not null, carrera_oficial text not null, consulta_costos text, ficha_url text, fuente_oferta_url text, evidencia_sede text, periodo_fuente text"),
    "Duraciones": ("duraciones", "oferta_id", "oferta_id integer primary key references public.orienta_ofertas, duracion_valor numeric not null check (duracion_valor > 0), unidad text not null, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null"),
    "Tarifas_UCSS": ("tarifas_ucss", "tarifa_id", "tarifa_id integer primary key, creditos_matriculados integer not null check (creditos_matriculados > 0), categoria text not null, tarifa_por_credito_pen numeric not null, cuotas_por_semestre integer not null, matricula_pen numeric not null, moneda text not null, periodo text not null, fuente_id integer not null references public.orienta_fuentes, aplicacion text not null, cuota_calculada_pen numeric, ensenanza_semestre_pen numeric, total_con_matricula_pen numeric"),
    "Registro_MINEDU": ("registro_minedu", "registro_id", "registro_id integer primary key, codigo_modular text, nombre_registro text, gestion_registro text, region text, provincia text, distrito text, actualizacion_documento date, fuente_id integer not null references public.orienta_fuentes, alcance text not null"),
    "BecaTEC_2025": ("becatec_2025", "registro_id", "registro_id integer primary key, institucion_documento text, distrito_documento text, programa_documento text, modalidad_documento text, nivel_documento text, convocatoria_anio integer not null, fuente_id integer not null references public.orienta_fuentes, alcance text not null"),
}


def columns(definition: str) -> list[str]:
    return [column.strip().split()[0] for column in definition.split(",")]
