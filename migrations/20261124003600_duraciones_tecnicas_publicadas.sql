-- Prospecto oficial de IESTP Manuel Arévalo Cáceres: tres años para sus tres programas.
-- Malla de SISE: ciclos I–VI de Administración de Hoteles y Restaurantes.
WITH institutions(institution_id, citation_id, url, period, duration, unit) AS (
  VALUES
    (19, 990296, 'https://iestp-mac.edu.pe/src/img/admision/prospecto_MAC2022_FINAL.pdf', 'Prospecto 2022', 3, 'años'),
    (10, 990316, 'https://back.sise.edu.pe/uploads/BROCHURE_ADMINISTRACION_DE_RESTAURANTES_Y_HOTELES_compressed_0065967cb1.pdf', 'Malla oficial', 6, 'ciclos')
), inserted_sources AS (
  INSERT INTO public.orienta_fuentes (fuente_id, emisor_tipo, url, fecha_o_periodo_fuente, fecha_consulta)
  SELECT citation_id, 'Plan académico oficial', url, period, DATE '2026-11-24'
  FROM institutions
  ON CONFLICT (fuente_id) DO NOTHING
  RETURNING fuente_id, url
), sources AS (
  SELECT fuente_id, url FROM inserted_sources
  UNION ALL
  SELECT current.fuente_id, current.url
  FROM public.orienta_fuentes AS current
  JOIN institutions ON institutions.citation_id = current.fuente_id
), programs(offer_id, institution_id) AS (
  VALUES (296, 19), (297, 19), (298, 19), (316, 10), (326, 10), (349, 10)
)
INSERT INTO public.orienta_duraciones (oferta_id, duracion_valor, unidad, fuente_id, fecha_consulta)
SELECT offer.oferta_id, institutions.duration, institutions.unit, sources.fuente_id, DATE '2026-11-24'
FROM programs
JOIN public.orienta_ofertas AS offer ON offer.oferta_id = programs.offer_id AND offer.institucion_id = programs.institution_id
JOIN institutions ON institutions.institution_id = programs.institution_id
JOIN sources ON sources.fuente_id = institutions.citation_id AND sources.url = institutions.url
ON CONFLICT (oferta_id) DO NOTHING;
