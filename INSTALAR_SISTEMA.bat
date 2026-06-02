@echo off
TITLE Instalador de eiGYM
cd /d "%~dp0"

echo ============================================================
echo   Iniciando el Instalador de eiGYM...
echo   (Se recomienda que MySQL este activo antes de iniciar)
echo ============================================================
echo.

powershell -ExecutionPolicy Bypass -File "INSTALADOR.ps1"

echo.
echo ============================================================
echo   El proceso del instalador ha terminado.
echo ============================================================
pause
