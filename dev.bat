@echo off
title Conobras Quote - Modo Desarrollo (Laravel + Vite Hot-Reload)
echo ==========================================================
echo    CONOBRAS QUOTE - MODO DESARROLLO (HOT RELOAD)
echo ==========================================================

:: Detectar ejecutable de PHP
set PHP_BIN=php
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe" (
        set PHP_BIN="C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe"
    )
)

echo Iniciando servidor Laravel y Vite simultáneamente...
start "Laravel Server" %PHP_BIN% artisan serve --port=8000
start "Vite Dev Server" npm run dev

timeout /t 2 >nul
start http://localhost:8000
