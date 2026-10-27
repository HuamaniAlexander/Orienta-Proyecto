# Arquitectura

```mermaid
flowchart LR
  React --> HTTP[FastAPI / HTTP]
  HTTP --> Casos[Casos de uso]
  Casos --> Dominio
  Casos --> Puertos
  PostgreSQL[Adaptador PostgreSQL / InsForge] -. implementa .-> Puertos
  Gemini[Adaptador Gemini] -. implementa .-> Puertos
  ML[Adaptador scikit-learn] -. implementa .-> Puertos
```

El dominio no importa FastAPI, SQL, SDKs ni proveedores. Bootstrap compone
puertos y adaptadores. Los routers solo validan y traducen solicitudes.
No se crean capas vacías: las funcionalidades añadirán sus entidades y puertos.

Estado actual: fábrica FastAPI y endpoint de vivacidad, configuración de CORS y
frontend de verificación del entorno. Aún no existen adaptadores de negocio.
`/health` confirma el proceso, no disponibilidad PostgreSQL/ML/Gemini.
La disponibilidad real se incorporará al integrar persistencia.
