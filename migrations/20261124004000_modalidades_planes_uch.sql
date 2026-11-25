-- Mallas curriculares publicadas por UCH, sección Transparencia universitaria.
-- https://www2.uch.edu.pe/www.uch.edu.pe/conocenos/transparencia.html
-- Registra únicamente los formatos respaldados por una malla con nombre y modalidad.
WITH programs(offer_id, modality_id) AS (
  VALUES (113, 5), (114, 1), (115, 1), (116, 1), (118, 5), (119, 5),
         (120, 5), (121, 5), (122, 5), (123, 5), (124, 1), (125, 5),
         (126, 5), (127, 5)
)
UPDATE public.orienta_ofertas AS offer
SET modalidad_id = programs.modality_id
FROM programs
WHERE offer.institucion_id = 4
  AND offer.oferta_id = programs.offer_id
  AND offer.modalidad_id = 4;
