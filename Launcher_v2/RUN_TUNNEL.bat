@echo off
call "%~dp0config.bat"

echo ------------------------------------------
echo RUN_TUNNEL
echo ------------------------------------------

REM =====================================================
REM Cek apakah tunnel sudah aktif
REM =====================================================

"%CLOUDFLARE_EXE%" tunnel info "%TUNNEL_NAME%" | find "CONNECTOR ID" >nul

if %errorlevel%==0 (
    echo Tunnel already running.
    exit /b 0
)

echo Starting Cloudflare Tunnel...

start "SIGNAL13 Tunnel" cmd /k ^
""%CLOUDFLARE_EXE%" tunnel run "%TUNNEL_NAME%""

exit /b 0