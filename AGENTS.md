# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **Orienta-Proyecto** (API base `https://pg7e5nq9.us-east.insforge.app`). El CLI enlazado por URL muestra `oss-project` como metadato genérico.
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** el backend lee `.env` en la raíz; el CLI lee `.insforge/project.json`. Nunca versionar claves. El frontend solo recibe `VITE_API_BASE_URL`.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Alcance ORIENTA

- InsForge se utiliza únicamente para PostgreSQL en este MVP.
- React + TypeScript, FastAPI + Python y arquitectura hexagonal.
- Sin login ni registro; Gemini solo desde backend.
- Ramas por tarea desde dev y PR hacia dev; no fusionar sin autorización.
- Tablero Trello oficial: https://trello.com/b/rGV9WAdT/orienta-proyecto.
  Usa el JSON exportado para comprobar tarjetas y checklists; no alteres estados
  sin evidencia.
- Preservar IDs y fuentes del Excel. No interpretar datos ausentes como cero.
