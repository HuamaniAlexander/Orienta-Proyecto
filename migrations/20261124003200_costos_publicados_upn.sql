-- Condiciones publicadas por UPN para admisión de pregrado 2027-01.
-- https://www.upn.edu.pe/transparencia/pensiones-tarifas
-- Los intervalos corresponden a toda la institución. No identifican una cuota por sede.
UPDATE public.orienta_ofertas
SET consulta_costos = 'Prematrícula: S/ 365–380' || chr(10) ||
  'Enseñanza: S/ 460–2,605 por cuota' || chr(10) ||
  'Admisión de pregrado 2027-01 · 5 cuotas por periodo académico' || chr(10) ||
  'Rangos institucionales. El importe depende de la carrera, el campus y la modalidad.'
WHERE institucion_id = 2
  AND consulta_costos = 'Consultar tarifas de matrícula, enseñanza y otros derechos según carrera, sede y convocatoria en Admisión';
