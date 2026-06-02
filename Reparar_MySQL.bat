@echo off
setlocal enabledelayedexpansion

title Reparador de MySQL XAMPP - eiGYM
color 0B

echo ============================================================
echo.
echo     REPARADOR AUTOMATICO DE MYSQL PARA XAMPP
echo.
echo ============================================================
echo Este script soluciona el problema comun de MySQL cuando
echo no inicia debido a corrupcion en los archivos de log.
echo.
echo [!] IMPORTANTE: Asegurese de que XAMPP Control Panel este
echo     abierto pero con MySQL detenido.
echo.
set /p "confirm=Desea continuar? (S/N): "
if /i not "%confirm%"=="S" exit /b

set XAMPP_PATH=C:\xampp
set MYSQL_PATH=%XAMPP_PATH%\mysql
set DATA_PATH=%MYSQL_PATH%\data
set BACKUP_PATH=%MYSQL_PATH%\backup

:: Verificar si las rutas existen
if not exist "%DATA_PATH%" (
    echo [ERROR] No se encontro la carpeta %DATA_PATH%
    echo Verifique que XAMPP este instalado en C:\xampp
    pause
    exit /b
)

if not exist "%BACKUP_PATH%" (
    echo [ERROR] No se encontro la carpeta de backup en %BACKUP_PATH%
    echo No se puede proceder sin la carpeta backup original de XAMPP.
    pause
    exit /b
)

echo.
echo [+] Paso 1: Deteniendo cualquier instancia de MySQL...
taskkill /f /im mysqld.exe >nul 2>&1

echo [+] Paso 2: Creando respaldo de la carpeta 'data' actual...
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set OLD_DATA_NAME=data_old_%TIMESTAMP%
ren "%DATA_PATH%" "%OLD_DATA_NAME%"
set OLD_DATA_PATH=%MYSQL_PATH%\%OLD_DATA_NAME%

echo [+] Paso 3: Creando nueva carpeta 'data' desde el backup...
mkdir "%DATA_PATH%"
xcopy /s /e /y "%BACKUP_PATH%\*" "%DATA_PATH%\" >nul

echo [+] Paso 4: Restaurando bases de datos de usuario...
for /d %%f in ("%OLD_DATA_PATH%\*") do (
    set "dirname=%%~nxf"
    :: No copiar carpetas de sistema de MySQL
    if /i not "!dirname!"=="mysql" if /i not "!dirname!"=="performance_schema" if /i not "!dirname!"=="phpmyadmin" if /i not "!dirname!"=="test" (
        echo     -> Restaurando base de datos: !dirname!
        xcopy /s /e /y "%%f" "%DATA_PATH%\!dirname!\" >nul
    )
)

echo [+] Paso 5: Restaurando archivo crucial ibdata1...
copy /y "%OLD_DATA_PATH%\ibdata1" "%DATA_PATH%\ibdata1" >nul

echo.
echo ============================================================
echo            PROCESO FINALIZADO CON EXITO
echo ============================================================
echo.
echo 1. Intente iniciar MySQL en su XAMPP Control Panel.
echo 2. Si todo funciona, puede conservar o borrar la carpeta:
echo    %OLD_DATA_PATH%
echo.
echo Gracias por usar el soporte tecnico de eiGYM.
echo.
pause
