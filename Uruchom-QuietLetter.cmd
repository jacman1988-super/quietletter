@echo off
setlocal
set "QUIETLETTER_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%QUIETLETTER_NODE%" set "QUIETLETTER_NODE=node"
cd /d "%~dp0"
"%QUIETLETTER_NODE%" track_2b\src\run-local.mjs
if errorlevel 1 pause
endlocal
