# Manual: Despliegue de GitHub a Vercel

Ahora que tu código está en GitHub, conectarlo con Vercel es muy sencillo y permitirá que cada vez que subas cambios (`git push`), tu web se actualice sola.

## Paso 1: Conectar GitHub con Vercel

1. Inicia sesión en [Vercel.com](https://vercel.com).
2. Haz clic en el botón azul **"Add New"** y selecciona **"Project"**.
3. Verás una lista de tus repositorios de GitHub. Busca `eiGYM` y haz clic en **"Import"**.

---

## Paso 2: Configurar el Proyecto (Importante)

Vercel detectará que es un proyecto de Vite (Frontend) y Express (Backend). Configúralo así:

1. **Framework Preset**: Selecciona **"Vite"** (si no se selecciona solo).
2. **Root Directory**: Haz clic en **"Edit"** y selecciona la carpeta `./client`.
    > [!NOTE]
    > Esto desplegará el frontend. El backend se suele configurar como un proyecto separado o mediante una configuración Monorepo (ver guía avanzada).

---

## Paso 3: Variables de Entorno

Antes de darle a "Deploy", baja hasta la sección **"Environment Variables"**:

Añade estas variables (copia y pega los valores de tu `.env` local pero apuntando a la **nube**):

- `VITE_API_URL`: Aquí debes poner la URL de tu backend (ej: `https://tu-api.vercel.app/api`).
    *Si aún no has subido el backend, puedes dejarlo para después.*

---

## Paso 4: Desplegar el Backend (Opcional pero Recomendado)

Como el backend está en una carpeta distinta (`/server`), te recomiendo crear un **segundo proyecto** en Vercel para el servidor:

1. Nuevo Proyecto -> Importar `eiGYM`.
2. **Root Directory**: Selecciona `./server`.
3. **Environment Variables**:
   - `DATABASE_URL`: Tu URL de MySQL en la nube (ej: Railway o Aiven).
   - `JWT_SECRET`: Tu clave secreta.
   - `PORT`: 3000

---

## Paso 5: ¡A Volar!

1. Haz clic en **"Deploy"**.
2. Espera unos minutos y Vercel te dará una URL (ej: `eigym-frontend.vercel.app`).

---

### Resumen de Flujo de Trabajo
A partir de ahora, tu flujo de trabajo será:
1. Haces cambios en tu computadora.
2. Los subes con:
   ```bash
   git add .
   git commit -m "Mejora estética"
   git push
   ```
3. **Vercel detectará el push y actualizará tu web automáticamente en segundos.**

---

### ¿Problemas con la Base de Datos?
Recuerda que Vercel **no puede conectar a tu localhost** (tu computadora). La base de datos debe estar en internet. Si necesitas ayuda para crear una base de datos gratuita en la nube, ¡dímelo!
