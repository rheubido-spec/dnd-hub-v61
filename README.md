# D&D Hub Full-Stack Starter

A real multi-user starter for a Dungeons & Dragons 5e companion app with:
- FastAPI backend
- PostgreSQL data store
- JWT login/authentication
- Cloud-save-ready character sheets and campaigns
- Forum threads for help topics
- Responsive React web frontend that works well on desktop and mobile browsers
- Docker Compose for local development
- Alembic schema migrations
- Party-level audit logs

## What this version includes
- User registration and login
- Protected API routes
- Persistent PostgreSQL models for users, parties, memberships, invites, characters, campaigns, forum threads, forum replies, and party audit logs
- JSONB-backed flexible sheet storage for editable character sheets and campaign structures
- Dice rolling API with standard and custom dice sizes
- Reference links to official and open SRD-safe resources
- Party-sharing with DM/player permissions
- Superuser-only database overview endpoint and admin screen
- Alembic migration environment with an initial baseline migration
- Party audit log feed in the frontend and API
- Audit log filters, search, and CSV export
- Follow-up Alembic migration pattern for incremental schema changes

## Permission model
- The first registered account becomes the superuser for local setup.
- Creating a party automatically adds the creator as a `dm` membership.
- DMs can invite users, promote members between `player` and `dm`, and create party campaigns.
- Characters remain owned by their creator, but can be shared to a party for collaboration.
- Campaigns can be private or attached to a party. Party DMs can edit party campaigns.
- Party members can read that party’s audit log.

## Audit log coverage
The app now records party-level events for:
- party creation and updates
- invites sent and accepted
- member role changes and removals
- party-linked character creation, updates, unlinking, and deletion
- party-linked campaign creation, updates, and deletion

## Project layout
- `backend/` — FastAPI API, PostgreSQL models, and Alembic migrations
- `frontend/` — React + Vite responsive UI
- `docker-compose.yml` — local full-stack startup

## Quick start with Docker
1. Install Docker Desktop or Docker Engine with Compose.
2. From the project root, run:
   ```bash
   docker compose up --build
   ```
3. The API container runs `alembic upgrade head` automatically before starting the server.
4. Open the frontend at `http://localhost:5173`
5. API docs are at `http://localhost:8000/docs`
6. Register the first user account. That account becomes the initial superuser.

## Local backend setup without Docker
1. Create a PostgreSQL database.
2. Copy `backend/.env.example` to `backend/.env` and adjust values.
3. Create a Python virtual environment and install requirements:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

## Generating future migrations
From `backend/`:
```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Local frontend setup without Docker
1. Copy `frontend/.env.example` to `frontend/.env`
2. Install dependencies and start Vite:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Important implementation note
If you already ran an older version of this project that relied on `create_all`, use a fresh database or align your existing schema with Alembic before upgrading. This package includes a clean baseline migration and assumes Alembic owns the schema lifecycle going forward.

## Recommended next upgrades
- Add refresh tokens and password reset flows
- Add organization-level sharing across multiple parties
- Add file uploads for portraits, maps, and handouts using object storage
- Add search, notifications, and moderation tools for the forum
- Add SRD ingestion/caching service for open rules reference data
- Turn the web client into a PWA and wrap it with Capacitor for app-store mobile packaging
- Add audit log retention rules and soft-delete recovery workflows

## Notes on 5e content scope
This starter intentionally avoids bundling copyrighted paid rulebook text. It is structured to point users to official free rules and SRD-safe/open resources while keeping your own homebrew data in PostgreSQL.


## Audit log filtering and export

Party members can now:
- Filter audit events by action, entity type, actor, and date range
- Search audit logs by action, actor username/email, entity id, and JSON details
- Export the currently filtered audit log view as CSV

API endpoints:
- `GET /api/v1/parties/{party_id}/audit-logs/filter-options`
- `GET /api/v1/parties/{party_id}/audit-logs?action=&entity_type=&actor_id=&q=&start_date=&end_date=&limit=`
- `GET /api/v1/parties/{party_id}/audit-logs/export?action=&entity_type=&actor_id=&q=&start_date=&end_date=`

## Alembic follow-up migrations

This package now includes a second Alembic revision to demonstrate forward schema changes without rebuilding the baseline:
- `20260409_0001` — initial schema
- `20260409_0002` — persists invite roles and adds composite audit-log indexes

Create future migrations from `backend/` with:

```bash
alembic revision -m "describe your schema change"
```

Apply them with:

```bash
alembic upgrade head
```


## New in v5

- Party audit logs now support server-side pagination and sorting.
- Admins can archive older party audit logs into `party_audit_logs_archive`.
- Added a source registry and categorized open-content reference database.
- The app seeds open-content-safe source records and sample materials; bulk import remains limited to open or separately verified sources.
- `5etools` is added only as a registry entry with import disabled by default pending independent license verification by the operator.

### New endpoints

- `GET /api/v1/parties/{party_id}/audit-logs?page=1&page_size=25&sort_by=created_at&sort_dir=desc`
- `POST /api/v1/admin/audit-logs/archive?days_to_keep=90`
- `GET /api/v1/reference/sources`
- `GET /api/v1/reference/materials?category=race`
- `POST /api/v1/reference/seed-open-content` (superuser)

### Migration

Run:

```bash
alembic upgrade head
```

This applies the new archive and reference registry tables.


## Maintenance agent and end-to-end workflow

This project now includes a supervised maintenance agent for administrators. It does not make silent background changes. Instead, it records a structured maintenance run with integrity findings and optimization suggestions.

### In-app maintenance
- Open the Admin page
- Use **Run maintenance agent** to generate a new report
- Review data integrity findings, collaboration warnings, and UX/reliability suggestions

### Local CLI workflow
```bash
python tools/maintenance_agent.py
python tools/maintenance_agent.py --with-playwright
```

### Included quality checks
- FastAPI smoke tests in `backend/tests/test_smoke.py`
- Playwright browser smoke scaffold in `frontend/tests/e2e/smoke.spec.ts`
- GitHub Actions CI in `.github/workflows/ci.yml`

### Apply schema updates
```bash
cd backend
alembic upgrade head
```


## Browser E2E testing

The frontend includes a Playwright smoke test in `frontend/tests/e2e/smoke.spec.ts`.

Recommended commands:

```bash
cd frontend
npm install
npx playwright install chromium
npm run test:e2e
```

If you are running inside a Linux container or CI image that already has Chromium installed system-wide, use:

```bash
cd frontend
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

The Playwright config is hardened for container use:
- uses `node ./node_modules/vite/dist/node/cli.js` for the dev server instead of relying on a shell shim
- supports `PLAYWRIGHT_EXECUTABLE_PATH` for system Chromium
- includes `--no-sandbox`, `--disable-setuid-sandbox`, and `--disable-dev-shm-usage` launch flags

If browser navigation is blocked by your runtime policy, the Vite server can still be verified separately with:

```bash
curl -I http://127.0.0.1:5173/
```


## Windows quick launch

This package now includes Windows launcher scripts in the project root:

- `launch_dnd_hub_full_app.bat` - starts Docker Compose and opens the full app in Chrome after the server responds
- `launch_dnd_hub_frontend_only.bat` - starts the frontend-only mode and opens Chrome after the dev server is ready
- `diagnose_dnd_hub_ports.bat` - checks common local ports used by the app

For the full experience, start Docker Desktop first and then run `launch_dnd_hub_full_app.bat`.


## Windows quick start

Use `launch_dnd_hub_full_app.bat` from either:
- inside the `dnd_hub_fullstack` project folder, or
- the folder directly above it.

The launcher now:
- detects the correct project folder
- starts Docker Compose in a separate window
- waits for the frontend to respond
- opens Chrome automatically

If the app does not open, run `diagnose_dnd_hub_ports.bat` and check:
- `http://localhost:5173/`
- `http://localhost:8000/docs`


## PostgreSQL compatibility note

This package pins the local development database to `postgres:17-alpine` to avoid the PostgreSQL 18+ volume layout change that can prevent the container from initializing with the previous `/var/lib/postgresql/data` mount pattern.


## Package cleanup in v13

This package now extracts to a simpler top-level folder: `dnd_hub_fullstack`.
A favicon is also included, so the browser no longer logs a missing `/favicon.ico` request as a 404 for normal startup.


Note: The frontend now proxies API requests through the same origin at http://localhost:5173/api/v1, so login/register should work in Chrome without cross-origin issues.


Patched in v29: fixed JSX parent wrapping on Dashboard and Campaigns pages.


v42: Restored subclass UI with labeled searchable field and subclass chips on the character page.


v43: Maps page now has explicit square vs hexagonal grid selection and higher-detail SVG/PNG output.


v44: Added map icon stamps for castles, ruins, towers, ports, and dungeons.
