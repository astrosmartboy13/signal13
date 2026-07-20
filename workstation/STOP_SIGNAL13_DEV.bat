@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "RESTORE_SCRIPT=%SCRIPT_DIR%Restore-SIGNAL13.ps1"

net session >nul 2>&1
if not "%errorlevel%"=="0" (
    echo Requesting Administrator permission for SIGNAL13 Development Restore...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%ComSpec%' -ArgumentList '/c','\"%~f0\"' -Verb RunAs"
    exit /b
)

echo.
echo SIGNAL13 Development Mode Restore
echo Restoring services from the latest optimizer backup...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%RESTORE_SCRIPT%"

echo.
echo Done. Review workstation\logs for restore details.
pause
