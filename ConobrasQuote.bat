@echo off
title Conobras Quote - Presupuestos y Costos Arquitectonicos (Laravel)
echo ===================================================
echo     INICIANDO CONOBRAS QUOTE (LARAVEL + SQLITE)
echo ===================================================

:: Detectar ejecutable de PHP
set PHP_BIN=php
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe" (
        set PHP_BIN="C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe"
    )
)

echo Usando motor PHP: %PHP_BIN%

:: Comprobar si existe la base de datos SQLite
if not exist "database\database.sqlite" (
    echo Inicializando base de datos SQLite...
    type nul > database\database.sqlite
    %PHP_BIN% artisan migrate --seed --force
)

echo Servidor Laravel disponible en: http://localhost:8000
echo Abriendo navegador...
start http://localhost:8000

:: Iniciar servidor Laravel
%PHP_BIN% artisan serve --port=8000
