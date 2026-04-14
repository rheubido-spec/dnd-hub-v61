@echo off
setlocal
echo ==========================================
echo DND Hub Diagnostics
echo ==========================================
echo.

echo --- Docker check ---
where docker
docker version

echo.
echo --- Node check ---
where node
node -v

echo.
echo --- Listening ports ---
for %%P in (4173 5173 8000 5432) do (
  echo.
  echo ===== Port %%P =====
  netstat -ano | findstr :%%P
)

echo.
echo --- Helpful checks ---
echo If 5173 is missing, the full frontend is not running.
echo If 8000 is missing, the API is not running.
echo If 5432 is missing, PostgreSQL is not running.
echo.
echo For the full app:
echo   cd /d your\path\to\dnd_hub_fullstack
echo   docker compose up --build
echo.
echo Then open:
echo   http://localhost:5173/
echo   http://localhost:8000/docs
echo.
pause
endlocal
