@echo off
title SIGNAL13 Shutdown

echo.
echo ====================================
echo      SIGNAL13 Shutdown
echo ====================================
echo.

REM ===================================
REM STOP CLOUDFLARE
REM ===================================

echo Stopping Cloudflare...
taskkill /IM cloudflared.exe /F >nul 2>&1

REM ===================================
REM STOP GATEWAY (NODE)
REM ===================================

echo Stopping Gateway...
taskkill /IM node.exe /F >nul 2>&1

REM ===================================
REM STOP ONTIME
REM ===================================

echo Closing OnTime...
taskkill /IM ontime.exe /F >nul 2>&1

REM ===================================
REM CLOSE CHROME (OPTIONAL)
REM ===================================

REM taskkill /IM chrome.exe /F >nul 2>&1

echo.

echo SIGNAL13 Successfully Stopped.

timeout /t 2 >nul
exit