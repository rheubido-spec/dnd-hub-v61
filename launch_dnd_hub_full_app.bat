@echo off
setlocal ENABLEDELAYEDEXPANSION
title DND Hub Full App Launcher

REM Work whether this file is inside the project root or one folder above it
cd /d "%~dp0"
set "APP_DIR=%CD%"

if exist "%APP_DIR%\docker-compose.yml" (
  REM already in project root
) else if exist "%APP_DIR%\dnd_hub_fullstack\docker-compose.yml" (
  set "APP_DIR=%APP_DIR%\dnd_hub_fullstack"
) else (
  echo ERROR: Could not find docker-compose.yml
  echo Put this BAT file inside dnd_hub_fullstack or in the folder directly above it.
  echo.
  pause
  exit /b 1
)

echo Using project folder:
echo   %APP_DIR%
echo.

where docker >nul 2>nul
if errorlevel 1 (
  echo ERROR: Docker Desktop was not found in PATH.
  echo Start Docker Desktop and wait until it is fully running.
  echo.
  pause
  exit /b 1
)

docker version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker is installed but not responding yet.
  echo Open Docker Desktop, wait for it to finish starting, then run this launcher again.
  echo.
  pause
  exit /b 1
)

echo Starting DND Hub full stack in a new window...
start "DND Hub Stack" cmd /k "cd /d ""%APP_DIR%"" && docker compose up --build"

echo.
echo Waiting for frontend at http://localhost:5173/ ...
set "READY_URL=http://localhost:5173/"
set /a MAX_TRIES=90
set /a COUNT=0

:wait_loop
set /a COUNT+=1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing '%READY_URL%' -TimeoutSec 4; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 goto open_browser

if %COUNT% GEQ %MAX_TRIES% goto timeout
timeout /t 2 /nobreak >nul
goto wait_loop

:open_browser
echo Frontend is up. Opening Chrome...
start "" chrome "http://localhost:5173/"
if errorlevel 1 (
  if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173/"
  ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:5173/"
  ) else (
    echo Chrome was not found automatically.
    echo Open this manually:
    echo   http://localhost:5173/
  )
)

echo.
echo DND Hub URLs:
echo   Frontend: http://localhost:5173/
echo   API docs: http://localhost:8000/docs
echo.
exit /b 0

:timeout
echo.
echo The app did not become ready in time.
echo Run these checks in a Command Prompt:
echo   cd /d "%APP_DIR%"
echo   docker compose ps
echo   docker compose logs api
echo   docker compose logs web
echo.
echo Then try these URLs manually:
echo   http://localhost:5173/
echo   http://localhost:8000/docs
echo.
pause
exit /b 1
