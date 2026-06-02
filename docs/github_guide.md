# Guía para Subir eiGYM a GitHub

Subir tu proyecto a GitHub es el primer paso para poder desplegarlo fácilmente en Vercel. Sigue estos pasos detallados:

## 1. Crear un Repositorio en GitHub

1. Entra a [github.com](https://github.com) e inicia sesión.
2. Haz clic en el botón **"+"** (arriba a la derecha) y selecciona **"New repository"**.
3. Ponle un nombre (ej: `eiGYM`).
4. Déjalo como **Public** (o Private, si prefieres) y **NO** marques las opciones de "Add a README", ".gitignore" o "License" (ya los tenemos en el proyecto).
5. Haz clic en **"Create repository"**.

---

## 2. Inicializar Git en tu Computadora

Abre una terminal en la carpeta principal del proyecto (`eiGYM`) y ejecuta los siguientes comandos:

```bash
# 0. Configurar tu identidad (SOLO SI TE SALE EL ERROR "Author identity unknown")
# Reemplaza con tu correo y nombre
git config user.email "tu-correo@ejemplo.com"
git config user.name "Tu Nombre"


# 1. Inicializar el repositorio local
git init

# 2. Agregar todos los archivos (el archivo .gitignore que creé evitará subir basura)
git add .

# 3. Hacer tu primer "commit"
git commit -m "Initial commit: eiGYM Full Stack App"

# 4. Cambiar el nombre de la rama principal a 'main'
git branch -M main
```

---

## 3. Vincular y Subir a GitHub

Copia la URL de tu repositorio (será algo como `https://github.com/TU_USUARIO/eiGYM.git`) y ejecúta:

```bash
# 1. Vincular tu carpeta local con el repositorio de GitHub
# REEMPLAZA LA URL CON LA TUYA
git remote add origin https://github.com/TU_USUARIO/eiGYM.git

# 2. Subir el código
git push -u origin main
```

---

## 4. Próxima Vez (Actualizaciones)

Cuando hagas cambios y quieras subirlos a GitHub, solo necesitas:

```bash
git add .
git commit -m "Descripción de lo que cambiaste"
git push
```

> [!IMPORTANT]
> He creado un archivo `.gitignore` en la carpeta raíz para asegurar que tus contraseñas (archivos `.env`) y las carpetas pesadas (`node_modules`) **NO** se suban a internet por seguridad.

---

### ¿Qué hacer después?
Una vez que el código esté en GitHub, en tu panel de **Vercel** solo tendrás que darle a **"Import"** a este repositorio y el despliegue será automático cada vez que hagas un `git push`.
