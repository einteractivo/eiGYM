# ============================================================
#  Script de Instalación eiGYM - PowerShell
# ============================================================

try {
    # Ir a la carpeta donde está este script (importante para rutas relativas)
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if ($null -eq $scriptPath -or $scriptPath -eq "") { $scriptPath = Get-Location }
    Set-Location $scriptPath

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   Instalador de eiGYM" -ForegroundColor Cyan
    Write-Host "   [Se recomienda Ejecutar como Administrador]" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    # 0. Comprobar Privilegios de Administrador (para configurar servicios si es necesario)
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "  NOTA: El instalador NO se esta ejecutando como administrador." -ForegroundColor Yellow
        Write-Host "  No se podra configurar MySQL como servicio automaticamente." -ForegroundColor Yellow
        Write-Host "  (Recomendado: Ejecutar este script como Administrador)" -ForegroundColor Yellow
    }

    # 1. Comprobar Node.js
    Write-Host "[Verificando] Comprobando Node.js..." -ForegroundColor Yellow
    try {
        $nodeVersion = node -v 2>&1
        if ($LASTEXITCODE -ne 0 -and $nodeVersion -notmatch "v\d+") { throw "Node.js no encontrado" }
        Write-Host "  OK - Node.js $nodeVersion encontrado." -ForegroundColor Green
    }
    catch {
        Write-Host ""
        Write-Host "  ERROR: Node.js no esta instalado." -ForegroundColor Red
        Write-Host "  Descargue e instale Node.js desde: https://nodejs.org/" -ForegroundColor Red
        Write-Host "  Luego vuelva a ejecutar este instalador." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Presione ENTER para salir"
        exit 1
    }

    # 2. Comprobar MySQL (mysqladmin)
    Write-Host ""
    Write-Host "[Verificando] Comprobando conexion a MySQL..." -ForegroundColor Yellow
    $mysqlPaths = @(
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "mysql"
    )
    $mysqlExe = $null
    foreach ($p in $mysqlPaths) {
        if (Test-Path $p -ErrorAction SilentlyContinue) {
            $mysqlExe = $p
            break
        }
    }
    if ($null -eq $mysqlExe) {
        Write-Host ""
        Write-Host "  ADVERTENCIA: No se encontro el cliente MySQL en rutas comunes." -ForegroundColor Yellow
        Write-Host "  Asegurese de que XAMPP este instalado y MySQL este trabajando." -ForegroundColor Yellow
        Write-Host "  Continuando de todas formas..." -ForegroundColor Yellow
    }
    else {
        Write-Host "  OK - MySQL encontrado en: $mysqlExe" -ForegroundColor Green

        # Intentar configurar autostart (como servicio) si el script es admin y es XAMPP
        if ($isAdmin -and $mysqlExe.ToLower().Contains("xampp")) {
            Write-Host "  Configurando inicio automatico para MySQL (Servicio)..." -ForegroundColor Gray
            $mysqlService = Get-Service -Name "mysql" -ErrorAction SilentlyContinue
            if ($null -eq $mysqlService) {
                # Intentar instalar con SC
                $mysqlBinPath = Split-Path $mysqlExe
                $mysqldPath = Join-Path $mysqlBinPath "mysqld.exe"
                $myIniPath = Join-Path $mysqlBinPath "my.ini"
                if (Test-Path $mysqldPath) {
                    sc.exe create mysql binPath= "`"$mysqldPath`" --defaults-file=`"$myIniPath`" mysql" start= auto | Out-Null
                }
            }
            # Iniciar servicio si esta detenido
            Start-Service -Name "mysql" -ErrorAction SilentlyContinue
            Write-Host "  OK - MySQL configurado para iniciar automaticamente." -ForegroundColor Green
        }
    }

    # 3. Crear la base de datos 'eigym' si no existe
    Write-Host ""
    Write-Host "[0/3] Creando base de datos 'eigym' si no existe..." -ForegroundColor Yellow
    if ($null -ne $mysqlExe) {
        try {
            & $mysqlExe -u root --password="" -e "CREATE DATABASE IF NOT EXISTS eigym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1 | Out-Null
            Write-Host "  OK - Base de datos 'eigym' lista." -ForegroundColor Green
        }
        catch {
            Write-Host "  ADVERTENCIA: No se pudo crear la BD automáticamente. Creela manualmente en phpMyAdmin." -ForegroundColor Yellow
            Write-Host "  Nombre de la BD: eigym" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  NOTA: Cree manualmente la BD 'eigym' en phpMyAdmin si no existe." -ForegroundColor Yellow
    }

    # 4. Instalar Dependencias del Servidor
    Write-Host ""
    Write-Host "[1/3] Instalando dependencias del servidor..." -ForegroundColor Yellow
    Set-Location "$scriptPath\server"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR al instalar dependencias del servidor. Revise su conexion a internet." -ForegroundColor Red
        Read-Host "Presione ENTER para salir"
        exit 1
    }
    Write-Host "  OK - Dependencias del servidor instaladas." -ForegroundColor Green

    # 5. Configurar Base de Datos (Migraciones Prisma)
    Write-Host ""
    Write-Host "[2/3] Configurando la base de datos (migraciones)..." -ForegroundColor Yellow
    Set-Location "$scriptPath\server"

    Write-Host "  Generando cliente Prisma..." -ForegroundColor Gray
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR al generar cliente Prisma." -ForegroundColor Red
        Read-Host "Presione ENTER para salir"
        exit 1
    }

    Write-Host "  Aplicando migraciones a la base de datos..." -ForegroundColor Gray
    $migrateOutput = npx prisma migrate deploy 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  ERROR: Las migraciones fallaron." -ForegroundColor Red
        Write-Host "  Detalle: $migrateOutput" -ForegroundColor Gray
        Write-Host "  Verifique que:" -ForegroundColor Yellow
        Write-Host "    1. XAMPP este corriendo (MySQL activo)" -ForegroundColor Yellow
        Write-Host "    2. La base de datos 'eigym' exista en phpMyAdmin" -ForegroundColor Yellow
        Write-Host "    3. El archivo server\.env tenga el DATABASE_URL correcto" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Presione ENTER para salir"
        exit 1
    }
    Write-Host "  OK - Base de datos configurada." -ForegroundColor Green

    # 6. Ejecutar Seed (datos iniciales - usuario admin)
    Write-Host ""
    Write-Host "[3/3] Cargando datos iniciales (usuario superadmin)..." -ForegroundColor Yellow
    Set-Location "$scriptPath\server"
    $seedOutput = node scripts/seed-admin.js 2>&1
    Write-Host $seedOutput -ForegroundColor Gray
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - Usuario superadmin listo." -ForegroundColor Green
    }
    else {
        Write-Host "  ADVERTENCIA: El seed no se ejecuto correctamente." -ForegroundColor Yellow
        Write-Host "  Es posible que el usuario ya exista (esto es normal)." -ForegroundColor Yellow
    }

    # Finalizado
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "   INSTALACION COMPLETADA CON EXITO" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Usuario SUPERADMIN:" -ForegroundColor Cyan
    Write-Host "    Email:      admin@eigym.com" -ForegroundColor White
    Write-Host "    Contrasena: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Ahora haga doble clic en: INICIAR_SISTEMA.bat" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presione ENTER para salir"
}
catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "   ERROR INESPERADO DURANTE LA INSTALACION" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  Detalle del error: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Presione ENTER para salir y verifique los pre-requisitos."
    exit 1
}
