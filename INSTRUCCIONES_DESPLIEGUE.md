# Guía de Despliegue eiGYM en cPanel

Este documento describe los pasos necesarios para desplegar la plataforma eiGYM (SaaS) en un entorno de cPanel.

## 1. Preparación del Frontend (React + Vite)
En tu computadora local:
1. Abre una terminal en la carpeta `client`.
2. Ejecuta: `npm run build`.
3. Esto generará una carpeta `dist`.
4. El archivo `.htaccess` ya está incluido en `public/`, por lo que aparecerá en `dist/`.

## 2. Preparación del Backend (Node.js)
1. Ya tienes configurado tu archivo `server/.env.production`. **RENÓMBRALO a `.env`** cuando lo subas a cPanel.
   - El archivo ya contiene tus credenciales de base de datos listas para usar:
     `DATABASE_URL="mysql://eistream_eigymtacnaperu2026:i68%7DGB%3F%5BF%5BVYps%5BW@localhost:3306/eistream_eigymtacnaperu2026"`
     *(Nota: La contraseña está codificada en URL para Prisma, es normal que se vea con símbolos `%`).*
2. Sube todo el contenido de la carpeta `server` a tu directorio del subdominio en cPanel (ej: `api.eigym.eistreaming.net`).
3. **IMPORTANTE**: No subas la carpeta `node_modules`.
4. Sube también el archivo generado `eigym_produccion.sql` a través de **phpMyAdmin** para restaurar tu base de datos y socios en cPanel.

## 3. Configuración en cPanel
1. **Base de Datos**: Como ya creaste la BD (`eistream_eigymtacnaperu2026`), ve a **phpMyAdmin**, selecciona la base de datos y en la pestaña "Importar", sube el archivo `eigym_produccion.sql`.
2. **Setup Node.js App**:
   - Application Root: Ruta donde subiste el servidor (ej. `api.eigym.eistreaming.net`).
   - Application URL: Selecciona el subdominio `api.eigym.eistreaming.net`.
   - Application startup file: `app.js` (Archivo de entrada que preparé para cPanel).
3. **Instalación de Dependencias**:
   - Una vez configurada la app de Node.js, haz clic en "Run npm install" desde la interfaz de cPanel.
   - Ejecuta el comando de Prisma para generar el cliente conectándote por Terminal (SSH): `npx prisma generate`.

## 4. Archivos Estáticos y PWA
1. Sube el contenido de la carpeta `client/dist` al `public_html` de tu dominio principal (o donde desees que el usuario acceda).
2. Verifica que el archivo `manifest.webmanifest` (generado por Vite) sea accesible.
3. El archivo `.htaccess` se encargará de que las rutas de React funcionen correctamente.

## 5. Consideraciones de Seguridad
- Cambia `JWT_SECRET` en el `.env` de producción por una cadena larga y aleatoria.
- Asegúrate de que el puerto en el `.env` coincida con lo que espera cPanel (usualmente se ignora y cPanel usa un socket o puerto dinámico).

---
*Desarrollado por Antigravity para eiGYM*
