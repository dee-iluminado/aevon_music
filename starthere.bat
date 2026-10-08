@echo off
setlocal EnableExtensions
title AEVON Music
cd /d "%~dp0"

if not exist ".next\server\app" (
  echo First run detected - building the app...
  call npm run build
  if errorlevel 1 (
    echo Build failed. Make sure Node.js is installed and try again.
    pause
    exit /b 1
  )
)

echo Starting AEVON Music...
start "AEVON Music - server" /min cmd /k "title AEVON Music - server && npm start 2>&1"

echo Waiting for the server to come up...
set /a tries = 0
:waitloop
powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 2; exit 0}catch{exit 1}" >nul 2>&1
if errorlevel 1 (
  set /a tries+=1
  if %tries% GEQ 40 goto giveup
  timeout /t 1 /nobreak >nul
  goto waitloop
)

echo Server is up!
start "" "http://localhost:3001"
echo Your browser should have opened. The server runs in the "AEVON Music - server" window.
echo Close that window to stop the app.
timeout /t 3 /nobreak >nul
exit /b 0

:giveup
echo Server did not respond after 40 seconds.
echo Check the "AEVON Music - server" window for errors.
pause
exit /b 1