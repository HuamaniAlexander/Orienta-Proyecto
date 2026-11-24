-- UTP: Guía del Estudiante Pregrado Lima Norte, marzo de 2026, sección C.
-- https://www.utp.edu.pe/sites/default/files/2026-03/DPA-GU0697-Guia-del-Estudiante-Lima%20Norte-Pregrado-Marzo-2026.pdf
-- Solo programas de ingeniería y tecnología presenciales de la sede.
-- Científica: Categorías de Pago Pregrado Regular 2026-01, por carrera y escala.
-- https://www.cientifica.edu.pe/wp-content/uploads/2026/04/Categorias-2026-01-fv.pdf
-- El documento presenta importes de la institución, sin separarlos por sede.
WITH published AS (
  SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 30]) AS offer_id, 1 AS institution_id,
    concat_ws(chr(10), 'Matrícula regular: S/ 398.00', 'Enseñanza: S/ 815.00',
      'Por cuota · 5 cuotas', '16–22 horas lectivas · Ingreso desde agosto de 2018',
      'Lima Norte · Marzo 2026') AS costs
  UNION ALL
  SELECT offer_id, 22,
    concat_ws(chr(10), 'Matrícula de ingresante: S/ 380.00', 'Enseñanza: S/ ' || monthly_range || ' por mes',
      'Matrícula regular: S/ 350.00',
      'Pregrado regular 2026-01 · 5 mensualidades · Importe según escala',
      'El tarifario institucional no separa los montos por sede.')
  FROM (VALUES (366, '3,371–4,815'), (367, '1,685–3,544'), (368, '1,685–3,544'), (369, '1,685–3,544'), (370, '1,685–3,544'), (371, '1,685–3,544'), (372, '1,685–3,544'), (373, '1,685–3,544'), (374, '1,945–4,028'), (375, '1,532–3,221'), (376, '2,253–4,785'), (377, '1,685–3,544'), (378, '1,379–2,899'), (379, '1,685–3,544'), (380, '1,685–3,544'), (381, '1,685–3,544'), (382, '1,685–3,544'), (383, '1,532–3,221'), (384, '1,685–3,544'), (385, '1,685–3,544'), (386, '2,253–4,785'), (387, '1,685–3,544'), (388, '1,685–3,544'), (389, '1,685–3,544'), (391, '1,685–3,544'), (392, '1,685–3,544'), (393, '1,532–3,221'), (394, '1,945–4,028'), (395, '2,548–4,600'), (396, '1,685–3,544'), (397, '1,379–2,899'), (398, '1,685–3,544'), (399, '1,532–3,221'), (400, '1,685–3,544'), (401, '1,532–3,221'), (402, '1,685–3,544'), (403, '1,685–3,544')) AS verified(offer_id, monthly_range)
)
UPDATE public.orienta_ofertas AS offer
SET consulta_costos = published.costs
FROM published
WHERE offer.oferta_id = published.offer_id
  AND offer.institucion_id = published.institution_id
  AND offer.consulta_costos = 'Consultar tarifas de matrícula, enseñanza y otros derechos según carrera, sede y convocatoria en Admisión';
