# Guía de Actualización de eiGYM 🚀

Si ya tienes una versión anterior de eiGYM instalada en esta computadora, sigue estos pasos para actualizarla a la última versión sin perder tus datos (socios, ventas, configuraciones).

> [!IMPORTANT]
> **Antes de comenzar:** Asegúrate de cerrar cualquier ventana de `INICIAR_SISTEMA.bat` o procesos de Node/Servidor que estén corriendo.

---

### Paso 1: Preparar los archivos en el USB
1. En tu computadora de desarrollo, ejecuta el script `PREPARAR_USB.ps1`.
2. Copia la carpeta resultante `eiGYM` (especialmente las carpetas `client` y `server`) a tu memoria USB.

---

### Paso 2: Reemplazar el código en esta PC
1. Localiza la carpeta donde instalaste eiGYM anteriormente (ej. `C:\eiGYM`).
2. Copia las carpetas `client` y `server` de tu USB.
3. Pégalas en la carpeta de instalación en esta PC (`C:\eiGYM`).
4. Selecciona **"Reemplazar los archivos en el destino"** cuando Windows lo solicite.

---

### Paso 3: Mantener la conexión a la base de datos
El archivo que conecta eiGYM con MySQL es `server/.env`.
* **Si el archivo ya existe:** No lo reemplaces. Si Windows te pregunta, puedes omitir este archivo o asegurarte de que contiene el `DATABASE_URL` correcto (generalmente `mysql://root:@localhost:3306/eigym`).

---

### Paso 4: Actualizar la Base de Datos (Si hay cambios en el esquema)
Si la nueva versión incluye nuevas funciones (como nuevos reportes o campos en los socios), debes actualizar la estructura de la base de datos:

1. Abre una terminal de PowerShell dentro de la carpeta `server` de esta PC.
2. Ejecuta el siguiente comando para aplicar las migraciones de Prisma:
   ```powershell
   npx prisma migrate deploy
   ```
3. (Opcional) Si quieres asegurar que el Superadmin esté actualizado con los nuevos permisos, ejecuta:
   ```powershell
   node scripts/seed-admin.js
   ```

---

### Paso 5: Reiniciar el Sistema
Simplemente haz doble clic en **`INICIAR_SISTEMA.bat`**. La aplicación se abrirá con todas las mejoras y conservando tu información anterior.

---

**Soporte:** Si encuentras errores de conexión, verifica que el archivo `server/.env` sea correcto y que MySQL esté activado en el Panel de Control de XAMPP.
