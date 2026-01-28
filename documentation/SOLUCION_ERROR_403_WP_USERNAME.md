# 🔧 Solución: Error 403 "Nombre de usuario desconocido"

## ❌ Problema

Cuando ejecutas el action desde Vercel, recibes este error:

```
❌ [wp-auth] Error al renovar token: Nombre de usuario desconocido
Status: 403
```

## 🔍 Causa

El error **403 "Nombre de usuario desconocido"** significa que:

1. ✅ Las variables `WP_USERNAME` y `WP_PASSWORD` **SÍ están configuradas** en Vercel (por eso intenta renovar)
2. ❌ Pero el valor de `WP_USERNAME` **NO coincide** con ningún usuario en WordPress
3. ❌ O el `WP_PASSWORD` es incorrecto

## ✅ Solución

### Paso 1: Verificar el Usuario en WordPress

1. **Inicia sesión en WordPress Admin:**
   - Ve a: `https://twinkle.acuarelacore.com/wp-admin`
   - Inicia sesión con tu cuenta

2. **Verifica el nombre de usuario EXACTO:**
   - Ve a: **Usuarios → Tu Perfil**
   - Anota el **"Nombre de usuario"** (username) - **DEBE SER EXACTO**
   - También anota el **"Correo electrónico"** (por si necesitas usarlo)

3. **Opciones de usuario válidas:**
   - El **username** (ej: `blngltrnng`)
   - El **email** (ej: `nestor@bilingualchildcaretraining.com`)
   - Ambos deberían funcionar, pero usa el que funcione

### Paso 2: Verificar/Crear Application Password (Recomendado)

**Application Password es más seguro que usar tu contraseña principal:**

1. En WordPress Admin, ve a: **Usuarios → Tu Perfil**
2. Desplázate hasta **"Application Passwords"**
3. Si no existe, WordPress 5.6+ lo tiene por defecto
4. Crea un nuevo Application Password:
   - Nombre: `Vercel API` (o el que prefieras)
   - Click en **"Add New Application Password"**
   - **COPIA EL PASSWORD** (solo se muestra una vez)
   - Formato: `xxxx xxxx xxxx xxxx xxxx xxxx` (24 caracteres con espacios)

### Paso 3: Actualizar Variables en Vercel

1. **Ve al Dashboard de Vercel:**
   ```
   https://vercel.com/jhonolaves-projects/api-deeplingual2025/settings/environment-variables
   ```

2. **Verifica/Actualiza `WP_USERNAME`:**
   - Busca la variable `WP_USERNAME`
   - **Valor debe ser EXACTAMENTE** el username de WordPress (sin espacios)
   - Ejemplos válidos:
     - `blngltrnng` ✅
     - `admin` ✅
     - `nestor@bilingualchildcaretraining.com` ✅ (si WordPress acepta email)
   - **NO debe tener:**
     - Espacios al inicio o final ❌
     - Caracteres especiales incorrectos ❌
     - Mayúsculas si el username es minúsculas ❌

3. **Verifica/Actualiza `WP_PASSWORD`:**
   - Si usas **Application Password**: Pega el password completo (con espacios está bien)
   - Si usas **contraseña normal**: Asegúrate de que sea correcta
   - **NO debe tener espacios al inicio o final**

4. **Aplicar a todos los entornos:**
   - Selecciona: **Production, Preview, Development**
   - Click en **"Save"**

### Paso 4: Verificar que las Variables Estén Correctas

Ejecuta este script localmente para verificar:

```bash
node test-credentials.js
```

O verifica manualmente en Vercel:
- Settings → Environment Variables
- Busca `WP_USERNAME` y `WP_PASSWORD`
- Verifica que los valores sean correctos

### Paso 5: Hacer Redeploy

Después de actualizar las variables:

1. **Opción A: Redeploy desde Vercel Dashboard**
   - Ve a tu proyecto en Vercel
   - Click en el último deploy
   - Click en **"Redeploy"**

2. **Opción B: Push a Git**
   ```bash
   git commit --allow-empty -m "trigger redeploy after env vars update"
   git push
   ```

3. **Espera a que termine el deploy**

### Paso 6: Probar Nuevamente

Ejecuta el action desde OpenAI y verifica los logs en Vercel. Deberías ver:

```
✅ [wp-auth] Token renovado exitosamente
```

En lugar de:

```
❌ [wp-auth] Error al renovar token: Nombre de usuario desconocido
```

---

## 🔍 Verificación de Credenciales

### Script de Prueba Local

Crea un archivo `test-credentials.js`:

```javascript
require('dotenv').config();
const axios = require('axios');

const WP_URL = process.env.WP_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_PASSWORD = process.env.WP_PASSWORD;

async function testCredentials() {
  console.log('🧪 Probando credenciales de WordPress...\n');
  console.log(`URL: ${WP_URL}`);
  console.log(`Username: ${WP_USERNAME ? WP_USERNAME.substring(0, 3) + '***' : 'NO CONFIGURADO'}`);
  console.log(`Password: ${WP_PASSWORD ? '***' : 'NO CONFIGURADO'}\n`);

  if (!WP_URL || !WP_USERNAME || !WP_PASSWORD) {
    console.error('❌ Faltan variables de entorno');
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `${WP_URL}/wp-json/jwt-auth/v1/token`,
      {
        username: WP_USERNAME.trim(),
        password: WP_PASSWORD.trim()
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    if (response.data && response.data.token) {
      console.log('✅ Credenciales correctas!');
      console.log(`Token generado: ${response.data.token.substring(0, 50)}...`);
      console.log(`Usuario: ${response.data.user_display_name || 'N/A'}`);
      console.log(`Email: ${response.data.user_email || 'N/A'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 403) {
      console.error('\n💡 El username o password son incorrectos');
      console.error('Verifica:');
      console.error(`  - WP_USERNAME: "${WP_USERNAME}"`);
      console.error('  - Que el username sea exacto (sin espacios)');
      console.error('  - Que el password sea correcto');
    }
  }
}

testCredentials();
```

Ejecuta:
```bash
node test-credentials.js
```

---

## 📋 Checklist de Verificación

Antes de hacer deploy, verifica:

- [ ] `WP_USERNAME` en Vercel coincide EXACTAMENTE con el username de WordPress
- [ ] `WP_PASSWORD` en Vercel es correcto (o es un Application Password válido)
- [ ] No hay espacios al inicio/final en las variables
- [ ] Las variables están aplicadas a Production, Preview y Development
- [ ] Has hecho redeploy después de actualizar las variables

---

## 🆘 Si el Problema Persiste

1. **Verifica que el plugin JWT esté activo:**
   - WordPress Admin → Plugins
   - Busca "JWT Authentication for WP REST API"
   - Debe estar **Activo**

2. **Verifica la configuración del plugin:**
   - El plugin debe estar configurado en `wp-config.php`
   - Debe tener `JWT_AUTH_SECRET_KEY` definida

3. **Prueba con email en lugar de username:**
   - Cambia `WP_USERNAME` al email del usuario
   - Algunos plugins JWT aceptan email

4. **Revisa los logs completos en Vercel:**
   - Ve a Functions → Tu función → Logs
   - Busca mensajes de error más detallados

---

## 📞 Información de Debug

Si necesitas ayuda adicional, proporciona:

1. El username exacto que estás usando en Vercel (puedes ocultar parte)
2. Si estás usando Application Password o contraseña normal
3. Los logs completos de Vercel (últimas 50 líneas)
4. La versión del plugin JWT que tienes instalado

---

**Última actualización:** 2026-01-22











