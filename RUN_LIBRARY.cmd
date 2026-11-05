@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js, then run this file again.
  pause
  exit /b 1
)
echo Open http://localhost:8080 in your browser. Ctrl+C to stop.
node tools/serve.mjs
pause
