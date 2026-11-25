-- UPN Los Olivos tiene estudiantes en ambas modalidades de Administración.
-- https://www.upn.edu.pe/sites/default/files/documentos/numero-de-estudiantes-matriculados-pregrado-tradicional-2026-0.pdf
-- UCH publica ambas mallas para Administración en la ficha asociada a la oferta.
-- https://www.uch.edu.pe/facultades/ciencias-contables-economicas-y-financieras/administracion
WITH modality AS (
  INSERT INTO public.orienta_modalidades (codigo_id, etiqueta)
  VALUES (5, 'Presencial y semipresencial')
  ON CONFLICT (codigo_id) DO UPDATE SET etiqueta = EXCLUDED.etiqueta
  WHERE orienta_modalidades.etiqueta = EXCLUDED.etiqueta
  RETURNING codigo_id
)
UPDATE public.orienta_ofertas AS offer
SET modalidad_id = modality.codigo_id
FROM modality
WHERE (offer.oferta_id, offer.institucion_id) IN ((33, 2), (128, 4))
  AND offer.modalidad_id = 4;
