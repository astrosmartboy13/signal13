@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "OPTIMIZE_SCRIPT=%SCRIPT_DIR%Optimize-SIGNAL13.ps1"

net session >nul 2>&1
if not "%errorlevel%"=="0" (
    echo Requesting Administrator permission for SIGNAL13 Development Mode...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%ComSpec%' -ArgumentList '/c','\"%~f0\"' -Verb RunAs"
    exit /b
)

echo.
echo SIGNAL13 Development Mode
echo Running conservative session-only optimizer...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%OPTIMIZE_SCRIPT%"

echo.
echo Done. Review workstation\logs for backup and detailed log files.
pause
