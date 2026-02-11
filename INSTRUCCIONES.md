# Guía de Instalación y Ejecución del Proyecto eiGYM

Sigue estos pasos para levantar el proyecto en otra computadora.

## Pre-requisitos

Asegúrate de tener instalado en tu sistema:
1.  **Node.js** (versión 18 o superior recomendada).
2.  **MySQL** (y que el servicio esté corriendo).
3.  **Git** (opciona, para clonar el repositorio).

---

## 1. Configuración del Servidor (Backend)

El servidor utiliza Express y Prisma con una base de datos MySQL.

1.  Abre una terminal y navega a la carpeta `server`:
    ```bash
    cd server
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  Crea un archivo `.env` en la carpeta `server` y pega el siguiente contenido (ajusta la URL de la base de datos según tu configuración de MySQL):
    ```env
    # Puerto del servidor backend
    PORT=3000

    # URL de conexión a la base de datos MySQL
    # Formato: mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BASE_DE_DATOS
    DATABASE_URL="mysql://root:password@localhost:3306/eigym"
    ```
    > **Nota:** Reemplaza `root` y `password` con tu usuario y contraseña de MySQL. Reemplaza `eigym` con el nombre que desees para la base de datos (se creará automáticamente si no existe al ejecutar Prisma).

4.  Genera el cliente de Prisma y sincroniza la base de datos:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
    *(Este comando creará las tablas en tu base de datos MySQL)*.

5.  (Opcional) Si necesitas datos iniciales o un usuario administrador, puedes ejecutar el script de creación:
    ```bash
    node create-admin.js
    ```

6.  Inicia el servidor en modo desarrollo:
    ```bash
    npm run dev
    ```
    El servidor debería estar corriendo en `http://localhost:3000`.

---

## 2. Configuración del Cliente (Frontend)

El frontend está construido con Vite y React.

1.  Abre **otra** terminal y navega a la carpeta `client`:
    ```bash
    cd client
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  (Opcional) Si necesitas configurar la URL del backend, verifica el archivo `src/services/api.ts` o crea un archivo `.env` en la carpeta `client` si el proyecto lo requiere (por defecto suele conectarse a localhost:3000).

4.  Inicia la aplicación:
    ```bash
    npm run dev
    ```

5.  Abre tu navegador en la URL que muestra la terminal (usualmente `https://localhost:5173`).

### Solución a Problemas de Navegador

#### A. Aviso de "Conexión no privada"
Al usar HTTPS con un certificado de desarrollo (como lo hace este proyecto por el sensor de huellas), verás un aviso de seguridad.
1. Haz clic en **"Configuración avanzada"**.
2. Haz clic en **"Continuar a localhost (no seguro)"**.

#### B. Error de "Indicador de línea de comandos no admitido"
Si intentas abrir el navegador con flags como `--unsafely-treat-insecure-origin-as-secure`, Chrome puede dar error. **No es necesario** para `localhost`. Si necesitas probar desde una IP local:
1. Escribe `chrome://flags` en la barra de direcciones.
2. Busca: `Insecure origins treated as secure`.
3. Pega la URL (ej: `http://192.168.1.10:5173`).
4. Cambia a **Enabled** y reinicia el navegador.

---

## Resumen de Comandos

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
La creación de la base de datos eigym.
La estructura de todas las tablas necesarias (User, Member, Membership, Plan, Payment, Attendance) basadas en tu esquema de Prisma.
Un usuario administrador inicial pre-cargado:
Email: admin@eigym.com
Contraseña: admin123