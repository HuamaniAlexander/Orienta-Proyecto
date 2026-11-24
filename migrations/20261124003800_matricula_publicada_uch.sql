-- UCH, tarifario de pregrado 002-2026, numeral 2.1.
-- https://www2.uch.edu.pe/www.uch.edu.pe/cdn/pdf/transparencia/tarifario/002-2026_TARIFARIO_PREGRADO.pdf
-- El reglamento 002-2026 establece cinco cuotas por ciclo. No fija la pensión base.
UPDATE public.orienta_ofertas
SET consulta_costos = 'Matrícula regular: S/ 250.00' || chr(10) ||
  'Enseñanza: Importe base no publicado' || chr(10) ||
  'Pensión fraccionada en 5 cuotas por ciclo académico · Pregrado 2026'
WHERE institucion_id = 4
  AND consulta_costos = 'Consultar tarifas de matrícula, enseñanza y otros derechos según carrera, sede y convocatoria en Admisión';
