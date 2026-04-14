DND Hub Windows Quick Start

1. Extract this ZIP.
2. Open the extracted dnd_hub_fullstack folder.
3. Start Docker Desktop.
4. Double-click launch_dnd_hub_full_app.bat

Manual start:
  cd /d "C:\path\to\dnd_hub_fullstack"
  docker compose up --build

Open in Chrome:
  http://localhost:5173/

API docs:
  http://localhost:8000/docs


Note: The frontend now proxies API requests through the same origin at http://localhost:5173/api/v1, so login/register should work in Chrome without cross-origin issues.

Patched in v34: frontend Dockerfile switched from npm ci to npm install to avoid lockfile mismatch build failures.

Patched in v40: fixed missing subclassOptions prop on character forms causing frontend build failure.
