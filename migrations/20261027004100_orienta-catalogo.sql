-- ORIENTA: additive schema on an empty application database.

CREATE TABLE public.orienta_fuentes (fuente_id integer primary key, emisor_tipo text not null, url text not null, fecha_o_periodo_fuente text, fecha_consulta date not null);

ALTER TABLE public.orienta_fuentes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_fuentes FROM anon, authenticated;

CREATE TABLE public.orienta_distritos (distrito_id integer primary key, distrito text not null, provincia text, departamento text, pais text);

ALTER TABLE public.orienta_distritos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_distritos FROM anon, authenticated;

CREATE TABLE public.orienta_areas (area_id integer primary key, nombre_area text not null);

ALTER TABLE public.orienta_areas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_areas FROM anon, authenticated;

CREATE TABLE public.orienta_tipos (codigo_id integer primary key, etiqueta text not null);

ALTER TABLE public.orienta_tipos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_tipos FROM anon, authenticated;

CREATE TABLE public.orienta_gestiones (codigo_id integer primary key, etiqueta text not null);

ALTER TABLE public.orienta_gestiones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_gestiones FROM anon, authenticated;

CREATE TABLE public.orienta_modalidades (codigo_id integer primary key, etiqueta text not null);

ALTER TABLE public.orienta_modalidades ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_modalidades FROM anon, authenticated;

CREATE TABLE public.orienta_niveles (codigo_id integer primary key, etiqueta text not null);

ALTER TABLE public.orienta_niveles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_niveles FROM anon, authenticated;

CREATE TABLE public.orienta_instituciones (institucion_id integer primary key, nombre text not null, tipo_id integer not null references public.orienta_tipos, gestion_id integer not null references public.orienta_gestiones, web_url text, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null);

ALTER TABLE public.orienta_instituciones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_instituciones FROM anon, authenticated;

CREATE TABLE public.orienta_sedes (sede_id integer primary key, institucion_id integer not null references public.orienta_instituciones, nombre_sede text not null, distrito_id integer not null references public.orienta_distritos, distrito text, direccion text, alcance_del_local text, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null);

ALTER TABLE public.orienta_sedes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_sedes FROM anon, authenticated;

CREATE TABLE public.orienta_carreras (carrera_id integer primary key, nombre_catalogado text not null, area_id integer not null references public.orienta_areas, area_editorial text, enfoque_editorial text, ambitos_editoriales text, criterio_clasificacion text);

ALTER TABLE public.orienta_carreras ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_carreras FROM anon, authenticated;

CREATE TABLE public.orienta_ofertas (oferta_id integer primary key, institucion_id integer not null references public.orienta_instituciones, sede_id integer not null references public.orienta_sedes, carrera_id integer not null references public.orienta_carreras, area_id integer not null references public.orienta_areas, nivel_id integer not null references public.orienta_niveles, modalidad_id integer not null references public.orienta_modalidades, fuente_oferta_id integer not null references public.orienta_fuentes, fuente_ficha_id integer not null references public.orienta_fuentes, fecha_consulta date not null, carrera_oficial text not null, consulta_costos text, ficha_url text, fuente_oferta_url text, evidencia_sede text, periodo_fuente text);

ALTER TABLE public.orienta_ofertas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_ofertas FROM anon, authenticated;

CREATE TABLE public.orienta_duraciones (oferta_id integer primary key references public.orienta_ofertas, duracion_valor numeric not null check (duracion_valor > 0), unidad text not null, fuente_id integer not null references public.orienta_fuentes, fecha_consulta date not null);

ALTER TABLE public.orienta_duraciones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_duraciones FROM anon, authenticated;

CREATE TABLE public.orienta_tarifas_ucss (tarifa_id integer primary key, creditos_matriculados integer not null check (creditos_matriculados > 0), categoria text not null, tarifa_por_credito_pen numeric not null, cuotas_por_semestre integer not null, matricula_pen numeric not null, moneda text not null, periodo text not null, fuente_id integer not null references public.orienta_fuentes, aplicacion text not null, cuota_calculada_pen numeric, ensenanza_semestre_pen numeric, total_con_matricula_pen numeric);

ALTER TABLE public.orienta_tarifas_ucss ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_tarifas_ucss FROM anon, authenticated;

CREATE TABLE public.orienta_registro_minedu (registro_id integer primary key, codigo_modular text, nombre_registro text, gestion_registro text, region text, provincia text, distrito text, actualizacion_documento date, fuente_id integer not null references public.orienta_fuentes, alcance text not null);

ALTER TABLE public.orienta_registro_minedu ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_registro_minedu FROM anon, authenticated;

CREATE TABLE public.orienta_becatec_2025 (registro_id integer primary key, institucion_documento text, distrito_documento text, programa_documento text, modalidad_documento text, nivel_documento text, convocatoria_anio integer not null, fuente_id integer not null references public.orienta_fuentes, alcance text not null);

ALTER TABLE public.orienta_becatec_2025 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orienta_becatec_2025 FROM anon, authenticated;

ALTER TABLE public.orienta_sedes ADD UNIQUE(sede_id, institucion_id);

ALTER TABLE public.orienta_ofertas ADD FOREIGN KEY(sede_id, institucion_id) REFERENCES public.orienta_sedes(sede_id, institucion_id);

ALTER TABLE public.orienta_carreras ADD UNIQUE(carrera_id, area_id);

ALTER TABLE public.orienta_ofertas ADD FOREIGN KEY(carrera_id, area_id) REFERENCES public.orienta_carreras(carrera_id, area_id);

CREATE INDEX orienta_oferta_filtros ON public.orienta_ofertas(modalidad_id, institucion_id, carrera_id);

CREATE INDEX orienta_sedes_distrito ON public.orienta_sedes(distrito_id);

CREATE INDEX orienta_carrera_nombre ON public.orienta_carreras(lower(nombre_catalogado));

CREATE FUNCTION public.orienta_import_dataset(payload jsonb) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public, pg_temp AS $$ BEGIN INSERT INTO public.orienta_fuentes (fuente_id, emisor_tipo, url, fecha_o_periodo_fuente, fecha_consulta) SELECT fuente_id, emisor_tipo, url, fecha_o_periodo_fuente, fecha_consulta FROM jsonb_populate_recordset(NULL::public.orienta_fuentes, payload->'Fuentes') ON CONFLICT (fuente_id) DO UPDATE SET emisor_tipo=EXCLUDED.emisor_tipo, url=EXCLUDED.url, fecha_o_periodo_fuente=EXCLUDED.fecha_o_periodo_fuente, fecha_consulta=EXCLUDED.fecha_consulta;
INSERT INTO public.orienta_distritos (distrito_id, distrito, provincia, departamento, pais) SELECT distrito_id, distrito, provincia, departamento, pais FROM jsonb_populate_recordset(NULL::public.orienta_distritos, payload->'Distritos') ON CONFLICT (distrito_id) DO UPDATE SET distrito=EXCLUDED.distrito, provincia=EXCLUDED.provincia, departamento=EXCLUDED.departamento, pais=EXCLUDED.pais;
INSERT INTO public.orienta_areas (area_id, nombre_area) SELECT area_id, nombre_area FROM jsonb_populate_recordset(NULL::public.orienta_areas, payload->'Areas') ON CONFLICT (area_id) DO UPDATE SET nombre_area=EXCLUDED.nombre_area;
INSERT INTO public.orienta_tipos (codigo_id, etiqueta) SELECT codigo_id, etiqueta FROM jsonb_populate_recordset(NULL::public.orienta_tipos, payload->'Tipos') ON CONFLICT (codigo_id) DO UPDATE SET etiqueta=EXCLUDED.etiqueta;
INSERT INTO public.orienta_gestiones (codigo_id, etiqueta) SELECT codigo_id, etiqueta FROM jsonb_populate_recordset(NULL::public.orienta_gestiones, payload->'Gestiones') ON CONFLICT (codigo_id) DO UPDATE SET etiqueta=EXCLUDED.etiqueta;
INSERT INTO public.orienta_modalidades (codigo_id, etiqueta) SELECT codigo_id, etiqueta FROM jsonb_populate_recordset(NULL::public.orienta_modalidades, payload->'Modalidades') ON CONFLICT (codigo_id) DO UPDATE SET etiqueta=EXCLUDED.etiqueta;
INSERT INTO public.orienta_niveles (codigo_id, etiqueta) SELECT codigo_id, etiqueta FROM jsonb_populate_recordset(NULL::public.orienta_niveles, payload->'Niveles') ON CONFLICT (codigo_id) DO UPDATE SET etiqueta=EXCLUDED.etiqueta;
INSERT INTO public.orienta_instituciones (institucion_id, nombre, tipo_id, gestion_id, web_url, fuente_id, fecha_consulta) SELECT institucion_id, nombre, tipo_id, gestion_id, web_url, fuente_id, fecha_consulta FROM jsonb_populate_recordset(NULL::public.orienta_instituciones, payload->'Instituciones') ON CONFLICT (institucion_id) DO UPDATE SET nombre=EXCLUDED.nombre, tipo_id=EXCLUDED.tipo_id, gestion_id=EXCLUDED.gestion_id, web_url=EXCLUDED.web_url, fuente_id=EXCLUDED.fuente_id, fecha_consulta=EXCLUDED.fecha_consulta;
INSERT INTO public.orienta_sedes (sede_id, institucion_id, nombre_sede, distrito_id, distrito, direccion, alcance_del_local, fuente_id, fecha_consulta) SELECT sede_id, institucion_id, nombre_sede, distrito_id, distrito, direccion, alcance_del_local, fuente_id, fecha_consulta FROM jsonb_populate_recordset(NULL::public.orienta_sedes, payload->'Sedes') ON CONFLICT (sede_id) DO UPDATE SET institucion_id=EXCLUDED.institucion_id, nombre_sede=EXCLUDED.nombre_sede, distrito_id=EXCLUDED.distrito_id, distrito=EXCLUDED.distrito, direccion=EXCLUDED.direccion, alcance_del_local=EXCLUDED.alcance_del_local, fuente_id=EXCLUDED.fuente_id, fecha_consulta=EXCLUDED.fecha_consulta;
INSERT INTO public.orienta_carreras (carrera_id, nombre_catalogado, area_id, area_editorial, enfoque_editorial, ambitos_editoriales, criterio_clasificacion) SELECT carrera_id, nombre_catalogado, area_id, area_editorial, enfoque_editorial, ambitos_editoriales, criterio_clasificacion FROM jsonb_populate_recordset(NULL::public.orienta_carreras, payload->'Carreras') ON CONFLICT (carrera_id) DO UPDATE SET nombre_catalogado=EXCLUDED.nombre_catalogado, area_id=EXCLUDED.area_id, area_editorial=EXCLUDED.area_editorial, enfoque_editorial=EXCLUDED.enfoque_editorial, ambitos_editoriales=EXCLUDED.ambitos_editoriales, criterio_clasificacion=EXCLUDED.criterio_clasificacion;
INSERT INTO public.orienta_ofertas (oferta_id, institucion_id, sede_id, carrera_id, area_id, nivel_id, modalidad_id, fuente_oferta_id, fuente_ficha_id, fecha_consulta, carrera_oficial, consulta_costos, ficha_url, fuente_oferta_url, evidencia_sede, periodo_fuente) SELECT oferta_id, institucion_id, sede_id, carrera_id, area_id, nivel_id, modalidad_id, fuente_oferta_id, fuente_ficha_id, fecha_consulta, carrera_oficial, consulta_costos, ficha_url, fuente_oferta_url, evidencia_sede, periodo_fuente FROM jsonb_populate_recordset(NULL::public.orienta_ofertas, payload->'Ofertas') ON CONFLICT (oferta_id) DO UPDATE SET institucion_id=EXCLUDED.institucion_id, sede_id=EXCLUDED.sede_id, carrera_id=EXCLUDED.carrera_id, area_id=EXCLUDED.area_id, nivel_id=EXCLUDED.nivel_id, modalidad_id=EXCLUDED.modalidad_id, fuente_oferta_id=EXCLUDED.fuente_oferta_id, fuente_ficha_id=EXCLUDED.fuente_ficha_id, fecha_consulta=EXCLUDED.fecha_consulta, carrera_oficial=EXCLUDED.carrera_oficial, consulta_costos=EXCLUDED.consulta_costos, ficha_url=EXCLUDED.ficha_url, fuente_oferta_url=EXCLUDED.fuente_oferta_url, evidencia_sede=EXCLUDED.evidencia_sede, periodo_fuente=EXCLUDED.periodo_fuente;
INSERT INTO public.orienta_duraciones (oferta_id, duracion_valor, unidad, fuente_id, fecha_consulta) SELECT oferta_id, duracion_valor, unidad, fuente_id, fecha_consulta FROM jsonb_populate_recordset(NULL::public.orienta_duraciones, payload->'Duraciones') ON CONFLICT (oferta_id) DO UPDATE SET duracion_valor=EXCLUDED.duracion_valor, unidad=EXCLUDED.unidad, fuente_id=EXCLUDED.fuente_id, fecha_consulta=EXCLUDED.fecha_consulta;
INSERT INTO public.orienta_tarifas_ucss (tarifa_id, creditos_matriculados, categoria, tarifa_por_credito_pen, cuotas_por_semestre, matricula_pen, moneda, periodo, fuente_id, aplicacion, cuota_calculada_pen, ensenanza_semestre_pen, total_con_matricula_pen) SELECT tarifa_id, creditos_matriculados, categoria, tarifa_por_credito_pen, cuotas_por_semestre, matricula_pen, moneda, periodo, fuente_id, aplicacion, cuota_calculada_pen, ensenanza_semestre_pen, total_con_matricula_pen FROM jsonb_populate_recordset(NULL::public.orienta_tarifas_ucss, payload->'Tarifas_UCSS') ON CONFLICT (tarifa_id) DO UPDATE SET creditos_matriculados=EXCLUDED.creditos_matriculados, categoria=EXCLUDED.categoria, tarifa_por_credito_pen=EXCLUDED.tarifa_por_credito_pen, cuotas_por_semestre=EXCLUDED.cuotas_por_semestre, matricula_pen=EXCLUDED.matricula_pen, moneda=EXCLUDED.moneda, periodo=EXCLUDED.periodo, fuente_id=EXCLUDED.fuente_id, aplicacion=EXCLUDED.aplicacion, cuota_calculada_pen=EXCLUDED.cuota_calculada_pen, ensenanza_semestre_pen=EXCLUDED.ensenanza_semestre_pen, total_con_matricula_pen=EXCLUDED.total_con_matricula_pen;
INSERT INTO public.orienta_registro_minedu (registro_id, codigo_modular, nombre_registro, gestion_registro, region, provincia, distrito, actualizacion_documento, fuente_id, alcance) SELECT registro_id, codigo_modular, nombre_registro, gestion_registro, region, provincia, distrito, actualizacion_documento, fuente_id, alcance FROM jsonb_populate_recordset(NULL::public.orienta_registro_minedu, payload->'Registro_MINEDU') ON CONFLICT (registro_id) DO UPDATE SET codigo_modular=EXCLUDED.codigo_modular, nombre_registro=EXCLUDED.nombre_registro, gestion_registro=EXCLUDED.gestion_registro, region=EXCLUDED.region, provincia=EXCLUDED.provincia, distrito=EXCLUDED.distrito, actualizacion_documento=EXCLUDED.actualizacion_documento, fuente_id=EXCLUDED.fuente_id, alcance=EXCLUDED.alcance;
INSERT INTO public.orienta_becatec_2025 (registro_id, institucion_documento, distrito_documento, programa_documento, modalidad_documento, nivel_documento, convocatoria_anio, fuente_id, alcance) SELECT registro_id, institucion_documento, distrito_documento, programa_documento, modalidad_documento, nivel_documento, convocatoria_anio, fuente_id, alcance FROM jsonb_populate_recordset(NULL::public.orienta_becatec_2025, payload->'BecaTEC_2025') ON CONFLICT (registro_id) DO UPDATE SET institucion_documento=EXCLUDED.institucion_documento, distrito_documento=EXCLUDED.distrito_documento, programa_documento=EXCLUDED.programa_documento, modalidad_documento=EXCLUDED.modalidad_documento, nivel_documento=EXCLUDED.nivel_documento, convocatoria_anio=EXCLUDED.convocatoria_anio, fuente_id=EXCLUDED.fuente_id, alcance=EXCLUDED.alcance; END $$;

REVOKE ALL ON FUNCTION public.orienta_import_dataset(jsonb) FROM PUBLIC, anon, authenticated;

CREATE VIEW public.orienta_catalogo AS
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
LEFT JOIN public.orienta_duraciones du USING(oferta_id);

REVOKE ALL ON public.orienta_catalogo FROM anon, authenticated;
