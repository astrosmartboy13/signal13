@echo off
title SIGNAL13 Launcher V2
color 0A

call "%~dp0config.bat"

cls
echo.
echo ==========================================
echo          SIGNAL13 Launcher V2
echo ==========================================
echo.

REM =====================================================
REM START ONTIME
REM =====================================================

echo [1/4] OnTime

call "%~dp0RUN_ONTIME.bat"

call "%~dp0WAIT_HTTP.bat" "%ONTIME_URL%"

echo.

REM =====================================================
REM START GATEWAY
REM =====================================================

echo [2/4] Gateway

call "%~dp0RUN_GATEWAY.bat"

call "%~dp0WAIT_HTTP.bat" "%GATEWAY_HEALTH%"

echo.

REM =====================================================
REM START TUNNEL
REM =====================================================

echo [3/4] Tunnel

call "%~dp0RUN_TUNNEL.bat"

timeout /t 3 >nul

echo.

REM =====================================================
REM OPEN DASHBOARD
REM =====================================================

echo [4/4] Opening Browser

start "" "%DASHBOARD%"
start "" "%EDITOR%"
start "" "%TIMER%"
start "" "%BACKSTAGE%"
start "" "%TIMELINE%"
start "" "%STUDIO%"

echo.
echo ==========================================
echo           SIGNAL13 READY
echo ==========================================

timeout /t 2 >nul

exit /b 0