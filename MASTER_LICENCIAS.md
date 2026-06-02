# Documentación del Generador de Licencias para eiGYM

Este documento explica cómo funciona internamente el sistema de licencias de **eiGYM** y proporciona el código y las instrucciones necesarias para implementar el **Master Licencias** en tu otra aplicación (**eiCMR**).

---

## 1. ¿Cómo funcionan las licencias en eiGYM?

La aplicación **eiGYM** utiliza un sistema de licencias sin conexión (offline) que se basa en codificar un objeto JSON en formato **Base64** junto con una semilla de seguridad (Salt).

### Estructura del Objeto de la Licencia (JSON):
La licencia decodificada es un objeto JSON plano con la siguiente estructura:
```json
{
  "machineId": "id-de-la-pc",
  "validUntil": "2026-12-31T23:59:59.999Z",
  "status": "active"
}
```

### Proceso de Cifrado (Generación):
1. El generador toma el **Machine ID** de la computadora cliente.
2. Calcula la fecha de expiración sumando los **meses de vigencia** solicitados a la fecha actual y la convierte a cadena ISO (`.toISOString()`).
3. Convierte el objeto JSON en un **texto plano**.
4. Se le antepone una cadena de seguridad o "Salt", que para eiGYM es exactamente: `EIGYM-V2-SECURE-`.
5. Convierte todo este bloque de texto final a **Base64**. Este texto resultante en Base64 es el código largo que el usuario final pega en eiGYM.

### Proceso de Descifrado (Validación en el cliente eiGYM):
Al activar el sistema, **eiGYM** decodifica el Base64, verifica que el texto resultante empiece con `EIGYM-V2-SECURE-`, extrae el JSON restante, y comprueba que la fecha actual no supere el `validUntil` y que el `machineId` coincida con el de la máquina física del cliente. Todo este proceso es local y no requiere internet.

---

## 2. Instrucciones para Implementar el "Master Licencias" en eiCMR

Dado que **eiCMR** estará en `C:\Users\Usuario\Desktop\eiCMR`, necesitarás crear un componente (si es interfaz gráfica) o un script (si es backend/consola) que replique la lógica de generación. 

Aquí tienes el núcleo lógico en **JavaScript/TypeScript** para que puedas integrarlo en **eiCMR**. No requiere librerías externas ni conexión a internet, utiliza únicamente las conversiones de texto estándar del navegador o Node.js.

### Opción A: Código puro JavaScript / Node.js
Si vas a integrar la ruta en el backend (Node.js/Express) de tu **eiCMR**:

```javascript
// Generador de Licencias - Backend eiCMR

// Semilla exacta (NO CAMBIAR, eiGYM espera esta misma semilla)
const SALT = "EIGYM-V2-SECURE-";

/**
 * Función principal para generar una licencia válida para eiGYM.
 * @param {string} machineId - El ID físico de la PC del cliente. Utiliza "GLOBAL" para acceso universal.
 * @param {number} validMonths - La cantidad de meses de vigencia (1, 3, 6, 12, etc.).
 * @returns {string} El código de activación (Base64) que se ingresará en eiGYM.
 */
function createEiGymLicense(machineId, validMonths) {
    if (!machineId) {
        throw new Error("El machineId de la PC destino es obligatorio.");
    }
    
    const months = parseInt(validMonths) || 1;

    // Calcular la fecha de expiración
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + months);
    // Para darles hasta el final del último día
    expirationDate.setHours(23, 59, 59, 999);

    // Crear la estructura de la licencia
    const licenseObj = {
        machineId: machineId,
        validUntil: expirationDate.toISOString(),
        status: "active"
    };

    // Convertir a JSON
    const jsonStr = JSON.stringify(licenseObj);
    
    // Concatenar el SALT y convertir a Base64
    const stringData = SALT + jsonStr;
    const base64License = Buffer.from(stringData).toString('base64');

    return base64License;
}

// Ejemplo de uso:
// const miCodigo = createEiGymLicense("01234567-89AB-CDEF-0123-456789ABCDEF", 12);
// console.log("Código generado para el cliente:", miCodigo);
```

### Opción B: Código para Frontend / React (Navegador Offline)
Si vas a crear una interfaz visual en el Frontend dentro de **eiCMR** (por ejemplo, en un panel de administrador):

```javascript
// Semilla exacta de eiGYM
const SALT = "EIGYM-V2-SECURE-";

/**
 * Función principal para generar la licencia en componentes de React/Vue (Frontend Browser)
 */
export function generateEiGymLicenseOffline(machineId, validMonths) {
    if (!machineId) return null;
    
    const months = parseInt(validMonths) || 1;
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + months);
    expirationDate.setHours(23, 59, 59, 999);

    const licenseObj = {
        machineId: machineId,
        validUntil: expirationDate.toISOString(),
        status: "active"
    };

    const jsonStr = JSON.stringify(licenseObj);
    const unencoded = SALT + jsonStr;
    
    // btoa() es el estándar en navegadores web para convertir a Base64
    // Funciona 100% offline
    return btoa(unencoded);
}
```

---

## 3. Guía de Integración Visual (Panel eiCMR)

Para que el usuario que manipule el **Master Licencias** tenga una experiencia fluida, te recomiendo crear la siguiente interfaz de usuario en el frontend de **eiCMR**:

1. **Campos de Entrada:**
   - Un `input` de texto para ingresar el **Machine ID** de la PC del cliente.
   - Un `select` o `input` numérico para la cantidad de **Meses** de validez.
2. **Botón de Acción:**
   - Un botón "Generar Código". (Al darle clic invoca la función `generateEiGymLicenseOffline` o llama a la API Backend que contiene `createEiGymLicense`).
3. **Área de Resultado:**
   - Un área de texto (`textarea` en solo lectura) grande para mostrar el código en Base64 larguísimo generado. Debe incluir un botón rápido de "Copiar al portapapeles".
4. **Resumen de la licencia:**
   - Visualizar junto al código: *"Licencia generada válida hasta el: DD/MM/AAAA"*.

### Notas Importantes
- **Compatibilidad Máxima:** La licencia la generas en un milisegundo en `eiCMR` sin requerir conexión a la nube ni a internet; esto es 100% matemático. Como en `eiGYM` también decodifican localmente, basta con que pases ese texto en Base64 por WhatsApp/Correo y tu cliente podrá activarlo al momento.
- Si requieres generar una licencia infinita/global, la estructura de `eiGYM` soporta un comodín como machineId: `GLOBAL`. Con la palabra literal `"GLOBAL"` junto con una vigencia de 1200 meses, puedes crear super-licencias.
