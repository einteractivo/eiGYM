# Script para preparar la carpeta del USB - eiGYM
$targetDirName = "eiGYM"
$baseDir = $PSScriptRoot
$targetDir = Join-Path $baseDir $targetDirName
$zipFile = Join-Path $baseDir "$targetDirName.zip"

Write-Host "--- PREPARANDO PAQUETE PARA DESPLIEGUE ---" -ForegroundColor Cyan

# 1. Limpiar carpetas y archivos previos
if (Test-Path $targetDir) { Remove-Item -Recurse -Force $targetDir }
if (Test-Path $zipFile) { Remove-Item -Force $zipFile }
New-Item -ItemType Directory -Path $targetDir | Out-Null

# 2. Construir Frontend (Producción)
Write-Host "Construyendo Frontend (esto puede tardar un minuto)..." -ForegroundColor Yellow
Set-Location (Join-Path $baseDir "client")
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al construir el Frontend. Deteniendo." -ForegroundColor Red
    pause
    exit
}
Set-Location $baseDir

# 3. Copiar archivos necesarios
Write-Host "Copiando archivos al paquete..." -ForegroundColor Yellow

# Archivos Raíz
Copy-Item (Join-Path $baseDir "INICIAR_SISTEMA.bat") "$targetDir/"
Copy-Item (Join-Path $baseDir "INSTALADOR.ps1") "$targetDir/"
Copy-Item (Join-Path $baseDir "INSTRUCCIONES_DESPLIEGUE.md") "$targetDir/LEAME_INSTRUCCIONES.md"

# Carpeta Client (Solo el build/dist)
New-Item -ItemType Directory -Path "$targetDir/client" | Out-Null
Copy-Item -Recurse (Join-Path $baseDir "client/dist") "$targetDir/client/"

# Carpeta Server
New-Item -ItemType Directory -Path "$targetDir/server" | Out-Null
Copy-Item -Recurse (Join-Path $baseDir "server/src") "$targetDir/server/"
Copy-Item -Recurse (Join-Path $baseDir "server/scripts") "$targetDir/server/"
Copy-Item -Recurse (Join-Path $baseDir "server/prisma") "$targetDir/server/"
Copy-Item (Join-Path $baseDir "server/package.json") "$targetDir/server/"
Copy-Item (Join-Path $baseDir "server/package-lock.json") "$targetDir/server/"
if (Test-Path (Join-Path $baseDir "server/.env")) {
    Copy-Item (Join-Path $baseDir "server/.env") "$targetDir/server/.env"
}
else {
    # Crear .env de plantilla si no existe
    @"
# Configuracion de base de datos MySQL
# Edite esta linea con los datos de su servidor MySQL
DATABASE_URL="mysql://root:@localhost:3306/eigym"
PORT=3000
JWT_SECRET=eigym_secret_key_2025
"@ | Set-Content "$targetDir/server/.env"
    Write-Host "  NOTA: Se creo un archivo .env de plantilla. Edítelo con los datos de su MySQL." -ForegroundColor Yellow
}

# 4. Crear archivo ZIP (opcional pero recomendado)
Write-Host "Comprimiendo carpeta en '$targetDirName.zip'..." -ForegroundColor Cyan
Compress-Archive -Path "$targetDir/*" -DestinationPath $zipFile -Force

Write-Host "`n[CARPETA '$targetDirName' Y ARCHIVO '$targetDirName.zip' LISTOS]" -ForegroundColor Green
Write-Host "Puede copiar la carpeta o el ZIP a su USB." -ForegroundColor Cyan
pause
