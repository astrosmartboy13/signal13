@echo off

echo.
echo Waiting OnTime Server...

:wait

curl -s http://127.0.0.1:4001/editor/ >nul

if errorlevel 1 (
    timeout /t 2 >nul
    goto wait
)

echo OnTime Ready.

exit /b