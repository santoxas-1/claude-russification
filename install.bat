@echo off
chcp 65001 >nul
title Установка русификатора Claude Desktop

echo ========================================================
echo   Установка русификатора Claude Desktop
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%install.ps1

if not exist "%PS_SCRIPT%" (
    echo [ОШИБКА] Файл install.ps1 не найден в папке:
    echo %SCRIPT_DIR%
    echo.
    pause
    exit /b 1
)

echo Запуск скрипта установки...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   [УСПЕХ] Русификатор успешно установлен!
    echo   Запустите Claude Desktop с ярлыка на Рабочем столе.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [ОШИБКА] Произошла ошибка во время установки.
    echo   Код возврата: %ERRORLEVEL%
    echo ========================================================
)

echo.
pause
