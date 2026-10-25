@echo off
setlocal EnableExtensions
title AEVON Music
cd /d "%~dp0"

if not exist ".next\server\app" (
  echo.
  echo First run detected - building the app...
  call npm run build
  if errorlevel 1 (
    echo.
    echo Build failed. Make sure Node.js is installed and try again.
    pause
    exit /b 1
  )
)

echo.
echo AEVON Music - Minimalist Music Streaming
echo.
echo Starting development server on http://localhost:3001
echo.

:: Run the development server directly
:: This will keep running until Ctrl+C is pressed
npm run dev

echo.
echo Server stopped.
pause
exit /b 0