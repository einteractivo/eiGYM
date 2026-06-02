@echo off
TITLE Preparar USB - eiGYM
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "PREPARAR_USB.ps1"
pause
