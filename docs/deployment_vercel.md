# Guía de Despliegue en Vercel - eiGYM

Desplegar una aplicación Full Stack (Express + React + MySQL) en Vercel requiere separar el frontend del backend o usar una configuración monorepo. Aquí tienes el procedimiento recomendado.

## 1. Preparar la Base de Datos (Nube)

Vercel no aloja bases de datos MySQL locales. Debes migrar tu base de datos a un proveedor en la nube.

**Opciones recomendadas:**
- **Railway.app**: Muy fácil de usar, permite crear MySQL en un clic.
- **Aiven.io**: Ofrece un plan gratuito de MySQL muy estable.
- **TiDB Cloud**: MySQL compatible y escalable con capa gratuita.

**Pasos:**
1. Crea una base de datos en uno de estos servicios.
2. Obtén la `DATABASE_URL` (ej: `mysql://user:pass@host:port/dbname`).
3. Desde tu terminal local en la carpeta `server`, ejecuta:
   ```bash
   npx prisma db push
   ```
   *Esto creará la estructura en la nueva base de datos de la nube.*

---

## 2. Configuración para Vercel (`vercel.json`)

Para que Vercel entienda que tienes un cliente y un servidor en el mismo repositorio, crea un archivo `vercel.json` en la **raíz** del proyecto:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/src/app.js"
    },
    {
      "source": "/(.*)",
      "destination": "/client/$1"
    }
  ],
  "redirects": [
    {
      "source": "/",
      "destination": "/client/"
    }
  ]
}
```
*Nota: Es posible que prefieras desplegarlos como dos proyectos separados en Vercel para mayor simplicidad.*

---

## 3. Despliegue Paso a Paso

### Opción A: Proyecto Único (Monorepo)
1. Sube tu código a **GitHub**.
2. En Vercel, haz clic en **"Add New" -> "Project"**.
3. Importa tu repositorio.
4. En **Environment Variables**, añade:
   - `DATABASE_URL`: Tu URL de la base de datos en la nube.
   - `JWT_SECRET`: Una clave aleatoria para la seguridad.
   - `VITE_API_URL`: `/api` (esto hará que el cliente use la misma ruta).

### Opción B: Proyectos Separados (Recomendado)
**Desplegar Backend:**
1. Crear proyecto Vercel apuntando a la subcarpeta `server`.
2. Framework Preset: **Other**.
3. Root Directory: `server`.
4. En Variables de Entorno: `DATABASE_URL`, `JWT_SECRET`.

**Desplegar Frontend:**
1. Crear proyecto Vercel apuntando a la subcarpeta `client`.
2. Framework Preset: **Vite**.
3. Root Directory: `client`.
4. En Variables de Entorno: `VITE_API_URL` (la URL que te dio Vercel para el backend + `/api`).

---

## 4. Consideraciones de Prisma en Vercel

Vercel necesita generar el cliente de Prisma durante el build. Asegúrate de que en el `package.json` de tu **server** tengas:

```json
"scripts": {
  "build": "prisma generate",
  "start": "node src/index.js"
}
```

---

## Resumen de Variables obligatorias
| Variable | Dónde | Valor |
| :--- | :--- | :--- |
| `DATABASE_URL` | Server | `mysql://...` (Cloud DB) |
| `JWT_SECRET` | Server | Alguna frase secreta |
| `VITE_API_URL` | Client | URL de tu API desplegada |
