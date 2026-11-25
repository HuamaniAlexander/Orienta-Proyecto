-- Fichas oficiales con número de semestres, modalidad presencial y Campus Lima Norte.
WITH verified(offer_id, source_id, program_url, semesters) AS (
  VALUES
    (151, 990151, 'https://enfermeria.uwiener.edu.pe/', 10),
    (152, 990152, 'https://medicinahumana.uwiener.edu.pe/', 14),
    (153, 990153, 'https://farmacia.uwiener.edu.pe/', 10),
    (154, 990154, 'https://odontologia.uwiener.edu.pe/', 10),
    (155, 990155, 'https://www.uwiener.edu.pe/carreras/psicologia/', 10),
    (156, 990156, 'https://www.uwiener.edu.pe/carreras/obstetricia/', 10),
    (157, 990157, 'https://www.uwiener.edu.pe/carreras/nutricion-y-dietetica/', 10),
    (158, 990158, 'https://www.uwiener.edu.pe/carreras/tecnologia-medica-en-terapia-fisica-y-rehabilitacion/', 10),
    (159, 990159, 'https://www.uwiener.edu.pe/carreras/tecnologia-medica-en-laboratorio-clinico-y-anatomia-patologica/', 10),
    (160, 990160, 'https://veterinaria.uwiener.edu.pe/', 10),
    (161, 990161, 'https://www.uwiener.edu.pe/carreras/ingenieria-industrial-y-de-gestion-empresarial/', 10),
    (162, 990162, 'https://www.uwiener.edu.pe/carreras/ingenieria-de-sistemas-e-informatica/', 10),
    (163, 990163, 'https://www.uwiener.edu.pe/carreras/ingenieria-inteligencia-artificial/', 10),
    (164, 990164, 'https://www.uwiener.edu.pe/carreras/ingenieria-ciberseguridad/', 10),
    (165, 990165, 'https://www.uwiener.edu.pe/carreras/ingenieria-civil/', 10),
    (166, 990166, 'https://www.uwiener.edu.pe/carreras/arquitectura/', 10),
    (167, 990167, 'https://www.uwiener.edu.pe/carreras/derecho-y-ciencia-politica/', 10),
    (168, 990168, 'https://www.uwiener.edu.pe/carreras/administracion-y-negocios-internacionales/', 10),
    (169, 990169, 'https://www.uwiener.edu.pe/carreras/administracion-y-marketing/', 10),
    (171, 990171, 'https://www.uwiener.edu.pe/carreras/administracion-y-direccion-de-empresas/', 10),
    (172, 990172, 'https://www.uwiener.edu.pe/carreras/comunicacion-en-medios-digitales/', 10)
), inserted_sources AS (
  INSERT INTO public.orienta_fuentes (fuente_id, emisor_tipo, url, fecha_o_periodo_fuente, fecha_consulta)
  SELECT source_id, 'Ficha oficial de carrera', program_url, 'Consulta 2026-11-24', DATE '2026-11-24'
  FROM verified
  ON CONFLICT (fuente_id) DO NOTHING
  RETURNING fuente_id, url
), sources AS (
  SELECT fuente_id, url FROM inserted_sources
  UNION ALL
  SELECT current.fuente_id, current.url
  FROM public.orienta_fuentes AS current JOIN verified ON verified.source_id = current.fuente_id
), updated_offers AS (
  UPDATE public.orienta_ofertas AS offer
  SET fuente_ficha_id = verified.source_id,
      ficha_url = verified.program_url,
      modalidad_id = CASE WHEN offer.modalidad_id = 4 THEN 1 ELSE offer.modalidad_id END
  FROM verified JOIN sources ON sources.fuente_id = verified.source_id AND sources.url = verified.program_url
  WHERE offer.oferta_id = verified.offer_id AND offer.institucion_id = 6
    AND offer.ficha_url IN ('https://campuslimanorte.uwiener.edu.pe/', verified.program_url)
  RETURNING offer.oferta_id, offer.fuente_ficha_id
)
INSERT INTO public.orienta_duraciones (oferta_id, duracion_valor, unidad, fuente_id, fecha_consulta)
SELECT updated.oferta_id, verified.semesters, 'semestres', updated.fuente_ficha_id, DATE '2026-11-24'
FROM updated_offers AS updated JOIN verified ON verified.offer_id = updated.oferta_id
ON CONFLICT (oferta_id) DO NOTHING;
