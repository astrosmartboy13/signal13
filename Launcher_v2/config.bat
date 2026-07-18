@echo off

REM ==========================================
REM SIGNAL13 Launcher Configuration
REM ==========================================

set APP_NAME=SIGNAL13

REM ---------- PATH ----------

set ONTIME_EXE=C:\Program Files\ontime\ontime.exe

set GATEWAY_DIR=C:\SIGNAL13
set GATEWAY_FILE=gateway.js

set CLOUDFLARE_EXE=C:\SIGNAL13\tools\cloudflared.exe
set TUNNEL_NAME=signal13

REM ---------- URL ----------

set ONTIME_URL=http://127.0.0.1:4001/

set GATEWAY_HEALTH=http://127.0.0.1:8080/health

set DASHBOARD=http://127.0.0.1:8080/dashboard/
set EDITOR=http://127.0.0.1:8080/editor/
set TIMER=http://127.0.0.1:8080/timer/
set BACKSTAGE=http://127.0.0.1:8080/backstage/
set TIMELINE=http://127.0.0.1:8080/timeline/
set STUDIO=http://127.0.0.1:8080/studio/