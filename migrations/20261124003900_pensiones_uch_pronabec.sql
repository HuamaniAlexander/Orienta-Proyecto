-- Resolución Jefatural 698-2026-MINEDU/VMGI-PRONABEC-OAF, anexos 1 y 2.
-- https://www.gob.pe/institucion/pronabec/normas-legales/7806685-698-2026-minedu-vmgi-pronabec-oaf
-- Importes para las becas y créditos educativos cubiertos, no para la admisión general.
WITH tariffs(offer_id, program_name, installment) AS (
  VALUES
    (113, 'Psicología', '710.00'),
    (114, 'Enfermería', '740.00'),
    (115, 'Farmacia y Bioquímica', '850.00'),
    (116, 'Nutrición y Dietética', '740.00'),
    (117, 'Medicina Humana', '2,400.00'),
    (118, 'Ingeniería de Sistemas e Informática', '720.00'),
    (119, 'Ingeniería Electrónica con mención en Telecomunicaciones', '720.00'),
    (120, 'Ingeniería Industrial', '720.00'),
    (121, 'Ingeniería Ambiental', '720.00'),
    (122, 'Educación Inicial', '570.00'),
    (123, 'Educación Primaria e Interculturalidad', '570.00'),
    (124, 'Comunicación y Medios digitales', '720.00'),
    (125, 'Derecho', '710.00'),
    (126, 'Marketing y Negocios Internacionales', '710.00'),
    (127, 'Contabilidad con mención en Finanzas', '710.00'),
    (128, 'Administración', '710.00')
)
UPDATE public.orienta_ofertas AS offer
SET consulta_costos = 'Matrícula regular: S/ 250.00' || chr(10) ||
  'Enseñanza: S/ ' || tariffs.installment || ' por cuota' || chr(10) ||
  '2026-I y 2026-II · 5 cuotas por ciclo académico' || chr(10) ||
  'Pensión aplicable a las becas y créditos educativos cubiertos por Pronabec.'
FROM tariffs
WHERE offer.institucion_id = 4
  AND offer.oferta_id = tariffs.offer_id
  AND offer.carrera_oficial = tariffs.program_name
  AND offer.consulta_costos LIKE 'Matrícula regular: S/ 250.00' || chr(10) || 'Enseñanza: Importe base no publicado%';
