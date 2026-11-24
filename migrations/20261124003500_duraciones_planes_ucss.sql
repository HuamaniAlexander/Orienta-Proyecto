-- Duraciones declaradas en los planes oficiales enlazados desde cada ficha UCSS.
WITH verified(offer_id, program_url, years) AS (
  VALUES
    (129, 'https://www.ucss.edu.pe/carreras-profesionales/gestion-operaciones-logistica-internacional', 5), -- https://www.ucss.edu.pe/images/fcec/malla-curricular/curriculo-programa-estudios-gestion-operaciones-logistica-internacional.pdf
    (130, 'https://www.ucss.edu.pe/carreras-profesionales/administracion', 5), -- https://www.ucss.edu.pe/images/fcec/malla-curricular/PLAN_ESTUDIOS_ADMINISTRACION_FCEC_2026.pdf
    (131, 'https://www.ucss.edu.pe/carreras-profesionales/contabilidad', 5), -- https://www.ucss.edu.pe/images/fcec/plan-estudios-carrera-profesional-contabilidad-ucss.pdf
    (132, 'https://www.ucss.edu.pe/carreras-profesionales/economia', 5), -- https://www.ucss.edu.pe/images/fcec/Plan_de_Estudios-resumido-ECONOMIA-2026.pdf
    (133, 'https://www.ucss.edu.pe/carreras-profesionales/educacion-inicial', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-educacion-inicial-ucss.pdf
    (134, 'https://www.ucss.edu.pe/carreras-profesionales/educacion-primaria', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-educacion-primaria-ucss.pdf
    (135, 'https://www.ucss.edu.pe/carreras-profesionales/educacion-especial', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-educacion-especial-ucss.pdf
    (136, 'https://www.ucss.edu.pe/carreras-profesionales/educacion-secundaria-filosofia-y-religion', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-filosofia-y-religion-ucss.pdf
    (137, 'https://www.ucss.edu.pe/carreras-profesionales/educacion-secundaria-lengua-inglesa', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-lengua-inglesa-ucss.pdf
    (138, 'https://www.ucss.edu.pe/carreras-profesionales/archivistica-y-gestion-documental', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-archivistica-y-gestion-documental-ucss.pdf
    (139, 'https://www.ucss.edu.pe/carreras-profesionales/turismo-y-patrimonio-cultural', 5), -- https://www.ucss.edu.pe/images/fceh/plan-estudios-carrera-profesional-turismo-y-patrimonio-cultural-ucss.pdf
    (141, 'https://www.ucss.edu.pe/carreras-profesionales/enfermeria', 5), -- https://www.ucss.edu.pe/images/fcs/Curriculo_Plan_Estudio_Enfermeria_actualizado.pdf
    (144, 'https://www.ucss.edu.pe/carreras-profesionales/nutricion-y-dietetica', 5), -- https://www.ucss.edu.pe/images/fcs/documentos/PLAN_ESTUDIOS_ACTUALIZADO-NUTRICION_DETETICA.pdf
    (145, 'https://www.ucss.edu.pe/carreras-profesionales/ingenieria-informatica', 5), -- https://www.ucss.edu.pe/images/fi/plan-estudios-carrera-profesional-ingenieria-informatica.pdf
    (146, 'https://www.ucss.edu.pe/carreras-profesionales/ingenieria-industrial', 5), -- https://www.ucss.edu.pe/images/fi/plan-estudios-carrera-profesional-ingenieria-industrial.pdf
    (147, 'https://www.ucss.edu.pe/carreras-profesionales/ingenieria-civil', 5), -- https://www.ucss.edu.pe/images/fi/plan-estudios-carrera-profesional-ingenieria-civil-2024-2027.pdf
    (149, 'https://www.ucss.edu.pe/carreras-profesionales/ingenieria-ambiental', 5), -- https://www.ucss.edu.pe/images/fia/plan-estudios-carrera-profesional-ingenieria-ambiental-ucss-2026.pdf
    (150, 'https://www.ucss.edu.pe/carreras-profesionales/agronomia', 5) -- https://www.ucss.edu.pe/images/fia/RESUMEN_DE_CURRICULO_DE_PLAN_DE_EST_UDIOS-_AGRONOMIA_2024.pdf
)
INSERT INTO public.orienta_duraciones (oferta_id, duracion_valor, unidad, fuente_id, fecha_consulta)
SELECT offer.oferta_id, verified.years, 'años', offer.fuente_ficha_id, DATE '2026-11-24'
FROM verified
JOIN public.orienta_ofertas AS offer ON offer.oferta_id = verified.offer_id
WHERE offer.institucion_id = 5 AND offer.ficha_url = verified.program_url
ON CONFLICT (oferta_id) DO NOTHING;
