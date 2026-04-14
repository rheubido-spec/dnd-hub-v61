@echo off
setlocal ENABLEDELAYEDEXPANSION
title DND Hub Frontend-Only Launcher

cd /d "%~dp0"
set "APP_DIR=%CD%"

if exist "%APP_DIR%\frontend\package.json" (
  REM already in project root
) else if exist "%APP_DIR%\dnd_hub_fullstack\frontend\package.json" (
  set "APP_DIR=%APP_DIR%\dnd_hub_fullstack"
) else (
  echo ERROR: Could not find the frontend folder.
  echo Put this BAT file inside dnd_hub_fullstack or in the folder directly above it.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found in PATH.
  echo Install Node.js and run this launcher again.
  echo.
  pause
  exit /b 1
)

echo Using project folder:
echo   %APP_DIR%
echo.
cd /d "%APP_DIR%\frontend"

if not exist node_modules (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting frontend in a new window...
start "DND Hub Frontend" cmd /k "cd /d ""%APP_DIR%\frontend"" && node .\node_modules\vite\dist\node\cli.js --host 127.0.0.1 --port 4173"

echo Waiting for frontend at http://127.0.0.1:4173/ ...
set /a MAX_TRIES=60
set /a COUNT=0

:wait_loop
set /a COUNT+=1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173/' -TimeoutSec 4; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 goto open_browser

if %COUNT% GEQ %MAX_TRIES% goto timeout
timeout /t 2 /nobreak >nul
goto wait_loop

:open_browser
start "" chrome "http://127.0.0.1:4173/"
if errorlevel 1 (
  if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://127.0.0.1:4173/"
  ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://127.0.0.1:4173/"
  ) else (
    echo Open this manually:
    echo   http://127.0.0.1:4173/
  )
)
exit /b 0

:timeout
echo.
echo Frontend did not become ready in time.
echo Check the DND Hub Frontend window for errors.
pause
exit /b 1
