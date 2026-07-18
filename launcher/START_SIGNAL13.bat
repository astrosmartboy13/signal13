@echo off
title SIGNAL13 Launcher
color 0A

cd /d C:\SIGNAL13

echo.
echo =====================================
echo         SIGNAL13 Launcher
echo =====================================
echo.

:: ======================================================
:: [1/4] START ONTIME
:: ======================================================

echo [1/4] Starting OnTime...

start "" "%~dp0RUN_ONTIME.vbs"

echo Waiting OnTime...

:WAIT_ONTIME

powershell -command "try{Invoke-WebRequest http://127.0.0.1:4001/ -UseBasicParsing > $null; exit 0}catch{exit 1}"

if errorlevel 1 (
    timeout /t 1 >nul
    goto WAIT_ONTIME
)

echo OnTime Ready.

:: ======================================================
:: [2/4] START GATEWAY
:: ======================================================

echo.
echo [2/4] Starting Gateway...

start "" "%~dp0RUN_GATEWAY.vbs"

echo Waiting Gateway...

:WAIT_GATEWAY

powershell -command "try{Invoke-WebRequest http://127.0.0.1:8080/health -UseBasicParsing > $null; exit 0}catch{exit 1}"

if errorlevel 1 (
    timeout /t 1 >nul
    goto WAIT_GATEWAY
)

echo Gateway Ready.

:: ======================================================
:: [3/4] START CLOUDFLARE
:: ======================================================

echo.
echo [3/4] Starting Cloudflare Tunnel...

start "" "%~dp0RUN_TUNNEL.vbs"

timeout /t 5 >nul

echo Tunnel Ready.

:: ======================================================
:: [4/4] OPEN DASHBOARD
:: ======================================================

echo.
echo [4/4] Opening Dashboard...

start "" http://127.0.0.1:8080/dashboard/

echo.
echo =====================================
echo         SIGNAL13 READY
echo =====================================

timeout /t 2 >nul

exit