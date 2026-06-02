# Guía: Crear Base de Datos MySQL Gratuita en la Nube

Para que tu aplicación funcione en Vercel, NECESITAS que la base de datos esté en internet. Usaremos **Railway.app** porque es lo más rápido y sencillo.

## Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app).
2. Inicia sesión con tu cuenta de **GitHub**.

---

## Paso 2: Crear el servicio MySQL

1. Haz clic en **"+ New Project"**.
2. Selecciona **"Provision MySQL"**.
3. Railway creará automáticamente un servidor de base de datos para ti.

---

## Paso 3: Obtener la URL de Conexión

1. Una vez creado el servicio MySQL, haz clic en él.
2. Ve a la pestaña **"Connect"** o **"Variables"**.
3. Busca la variable llamada `MYSQL_URL` o `DATABASE_URL`. Tendrá un formato como este:
   `mysql://root:contraseña@host:puerto/railway`
4. **Copia esa URL.**

---

## Paso 4: Cargar tu Base de Datos local a la Nube

Ahora vamos a subir tus tablas actuales a la nueva base de datos de Railway desde tu computadora:

1. En tu terminal de VS Code, asegúrate de estar en la carpeta `server`.
2. Ejecuta el siguiente comando (esto reemplaza TEMPORALMENTE tu base de datos local por la de la nube para sincronizar):
   ```bash
   # En Windows:
   set DATABASE_URL="TU_URL_DE_RAILWAY_COPIADA"
   npx prisma db push
   ```
   *Esto creará todas las tablas (Miembros, Pagos, etc.) en Railway.*

---

## Paso 5: Configurar en Vercel

Finalmente, toma esa misma URL de Railway y agrégala a las **Environment Variables** de tu proyecto en Vercel:

1. Ve a tu proyecto en Vercel -> Settings -> Environment Variables.
2. Key: `DATABASE_URL`
3. Value: `la URL que copiaste de Railway`
4. Haz clic en **Save**.

---

## Beneficios:
- **Gratis**: Railway ofrece una capa gratuita generosa para proyectos pequeños.
- **Acceso Remoto**: Podrás ver tus datos desde cualquier lugar.
- **Sin Instalación**: No necesitas MySQL instalado en el servidor de Vercel.

> [!TIP]
> Si prefieres otro servicio, **Aiven.io** también es una excelente opción gratuita para MySQL.
