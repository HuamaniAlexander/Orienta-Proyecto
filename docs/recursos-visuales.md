# Recursos visuales

Logo: Logo_ORIENTA_transparente.png del paquete de identidad entregado por el
usuario, convertido a WebP sin alterar proporciones. No se inventó una marca.

Hero: generado con la herramienta integrada ImageGen y convertido a WebP de
1100 px, calidad 78, 84 KB. Archivo frontend/public/images/estudiantes.webp.
No se presenta como fotografía real de una institución. El modo ligero oculta
las ilustraciones. InsForge se reserva para PostgreSQL; los recursos estáticos
se distribuyen con el frontend.

Prompt del hero (herramienta integrada, sin CLI):

> Use case: photorealistic-natural. Asset type: ORIENTA academic exploration website hero, landscape 3:2. Primary request: a candid editorial scene of three Peruvian young adult students talking and walking outdoors on a generic contemporary Lima university campus, carrying notebooks and a backpack. Warm natural daylight, green trees, clean understated architecture, relaxed optimistic mood. Blue and teal accents, realistic skin and hands, polished professional editorial photograph. No text, no logos, no university identity, no watermarks. This will be clearly labeled an AI-generated editorial illustration, never claimed as an actual institution.

## Evidencia de inicio

Playwright: navegación móvil, cierre con Escape, modo ligero, ruta inexistente
y ausencia de desbordamiento verificados en 360, 390, 768, 1024 y 1440 px.
Capturas revisadas visualmente y conservadas en docs/evidencias/.

## Banners del catálogo

Diez escenas editoriales generadas con ImageGen integrado, convertidas a WebP
640×400, calidad 70: tecnologia, ingenieria, negocios, salud, derecho,
educacion, creatividad, turismo, ambiente y humanidades. Están en
frontend/public/images/. Se seleccionan por área académica, no por institución.

Plantilla del prompt: "Use case: photorealistic-natural. Asset type: ORIENTA
career card banner, wide horizontal editorial photograph. Scene: [escena].
Natural daylight, professional composition, realistic details, warm neutral
colors with blue and teal accents. No text, no brand, no watermark, no
institution identity. Illustrative academic scene, not documentation of a real campus."

Escenas: desarrollo de software en laboratorio; ingeniería en taller industrial;
estudiantes revisando finanzas; estudiante de salud con modelo anatómico;
estudiante de derecho en biblioteca; docente preparando materiales sin niños;
estudiantes de diseño con bocetos; cocina de enseñanza con plato peruano;
estudiante ambiental examinando plantas; investigación social en biblioteca.

Iconos institucionales: 19 descargados desde sitios oficiales indicados por el
Excel. Procedencia exacta en frontend/public/images/instituciones.json.
Si no hay un recurso disponible se muestran iniciales de texto como respaldo,
sin inventar un logo ni establecer asociación institucional con ORIENTA.
