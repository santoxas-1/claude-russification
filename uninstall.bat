@echo off
chcp 65001 >nul
title Удаление русификатора Claude Desktop

echo ========================================================
echo   Удаление русификатора Claude Desktop
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%uninstall.ps1

if not exist "%PS_SCRIPT%" (
    echo [ОШИБКА] Файл uninstall.ps1 не найден!
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

echo.
pause
