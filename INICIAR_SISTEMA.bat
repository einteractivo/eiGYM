@echo off
setlocal enabledelayedexpansion
title eiGYM - Cargando Sistema...

REM Forzar que la ventana se vea
echo ============================================================
echo   Iniciando eiGYM - Por favor espere...
echo ============================================================
echo.

REM 1. Cambiar al directorio del script
cd /d "%~dp0"
set "BASE_DIR=%~dp0"

REM 2. Verificar si estan en una carpeta temporal (comun si no han extraido el ZIP)
echo !BASE_DIR! | find /i "Temp" > nul
if !ERRORLEVEL! equ 0 (
    echo.
    echo ATTENCION: Parece que esta ejecutando el sistema desde dentro del ARCHIVO ZIP.
    echo.
    echo POR FAVOR, EXTRAIGA LA CARPETA COMPLETA A SU ESCRITORIO ANTES DE CONTINUAR.
    echo.
    pause
    exit /b
)

REM 3. Verificar Node.js con mensaje detallado
echo [1/4] Verificando Node.js...
node -v > nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo.
    echo ERROR: Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor, instale Node.js (Version LTS) desde: https://nodejs.org/
    echo.
    pause
    exit /b
)
for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo OK - Node.js detectado (!NODE_VER!)

REM 4. Verificar Carpetas
if not exist "!BASE_DIR!server" (
    echo.
    echo ERROR: No se puede encontrar la carpeta 'server'.
    echo Carpeta actual: !BASE_DIR!
    echo Asegurese de no haber movido el archivo bat fuera de su sitio.
    echo.
    pause
    exit /b
)

REM 5. Intentar detectar MySQL (asumiendo XAMPP por defecto)
echo.
echo [2/4] Verificando Base de Datos (MySQL)...
tasklist /fi "imagename eq mysqld.exe" | find /i "mysqld.exe" > nul
if !ERRORLEVEL! neq 0 (
    echo   MySQL no detectado. Intentando arrancar desde XAMPP...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "XAMPP-MySQL" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini --standalone
        echo   Esperando 5 segundos a que MySQL inicie...
        timeout /t 5 /nobreak > nul
    ) else (
        echo   ADVERTENCIA: MySQL no esta activo y no se encontro XAMPP en ruta por defecto.
        echo   Asegurese de iniciar MySQL manualmente en su panel de control (XAMPP/WAMP).
        echo.
        pause
    )
) else (
    echo   OK - MySQL ya esta activo.
)

REM 6. Iniciar Servidor
echo.
echo [3/4] Lanzando Servidor Backend...
cd /d "!BASE_DIR!server"

REM Lanzamos el servidor en una ventana aparte para que el log sea visible
start "eiGYM-BACKEND" cmd /k "title eiGYM-BACKEND && echo Iniciando Servidor... && node src/index.js || (echo. && echo ERROR CRITICO: El servidor no pudo iniciar. && echo Revise que el puerto 3000 este libre y que haya ejecutado el instalador. && pause)"

REM 7. Abrir Navegador
echo.
echo [4/4] Esperando respuesta del servidor (5 segundos)...
timeout /t 5 /nobreak > nul

echo Abriendo navegador en http://localhost:3000...
start http://localhost:3000

echo.
echo ============================================================
echo   EL SISTEMA DEBE HABER ABIERTO EN SU NAVEGADOR. 
echo   Si no abrio, revise la ventana "eiGYM-BACKEND" para errores.
echo ============================================================
echo.
echo Presione una tecla para cerrar este asistente...
pause > nul
exit
