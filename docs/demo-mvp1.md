# Guion de demostración local — ORIENTA MVP 1

## Preparación

Sigue los requisitos y la configuración local del [README](../README.md).
Desde la raíz del proyecto, inicia los servicios con
`.\scripts\start-local.ps1`. Abre `http://127.0.0.1:5173`; la API y su
documentación OpenAPI están en `http://127.0.0.1:8000` y `/docs`.

No muestres ni compartas `.env`, claves de InsForge o la clave de Gemini.
La explicación con Gemini puede consumir cuota; si no está disponible, muestra
el mensaje de error y que la comparación básica sigue disponible. No presentes
una respuesta simulada como resultado real.

## Recorrido

1. En inicio, presenta el propósito: explorar y comparar opciones académicas
   de Lima Norte, sin registro ni test vocacional.
2. Abre el catálogo, combina búsqueda y filtros, y entra a una ficha para
   mostrar ubicación, modalidad y fuentes disponibles.
3. Selecciona dos ofertas distintas y abre el comparador. Revisa los datos
   alineados, el filtro «Solo diferencias» y las fuentes de cada opción.
4. Abre «Explicar diferencias con IA», elige hasta tres prioridades y,
   opcionalmente, distrito, modalidad e intereses. Solicita la explicación
   solo si el proveedor está configurado y disponible.
5. Si se genera una explicación, señala sus diferencias, coincidencias,
   referencias y límites. No la describas como una recomendación vocacional;
   puede no sugerir una opción ganadora.
6. Si falla la IA, usa el enlace para volver a la comparación y confirma que
   ambas opciones permanecen disponibles.
7. Repite el recorrido en anchos de 390, 768 y 1440 píxeles. Capturas existentes:
   [inicio](evidencias/inicio-390.webp),
   [catálogo](evidencias/catalogo-390.webp),
   [comparador](evidencias/comparador-390.webp) y
   [análisis](evidencias/analisis-390.webp).

## Evidencia y límites

Los contratos HTTP están en [API](api.md); los resultados de pruebas, CI y
accesibilidad están en [verificación](verificacion.md). Esas evidencias no
demuestran que haya servicios publicados ni sustituyen una prueba de usabilidad
con estudiantes. El despliegue permanece pendiente de configurar los servicios
y verificar la URL real.
