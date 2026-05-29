@echo off
setlocal
cd /d "%~dp0"

echo Starting Key Hunter...
echo Keep this window open while you play.

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

start "" cmd /c "timeout /t 2 /nobreak >nul && start """" ""http://127.0.0.1:4173"""

echo.
echo If the game did not open, use this link:
echo http://127.0.0.1:4173
echo.
"%NODE_EXE%" scripts\serve.mjs
pause
