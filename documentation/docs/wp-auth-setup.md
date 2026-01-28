# 🔐 Guía de Configuración: Renovación Automática de JWT

## Descripción

El módulo `wp-auth.js` proporciona **renovación automática del token JWT** para todas las peticiones a WordPress. Esto significa que:

✅ **Detecta automáticamente** cuando el JWT ha expirado (401/403)  
✅ **Renueva el token** usando credenciales de WordPress  
✅ **Reintenta la petición** automáticamente con el nuevo token  
✅ **Cachea el token** en memoria para mejorar el rendimiento  
✅ **Es compatible** con código existente (sin breaking changes)

---

## 📋 Requisitos Previos

### 1. Plugin JWT en WordPress

Necesitas uno de estos plugins instalados en WordPress:

**Opción A: JWT Authentication for WP REST API** (Recomendado)
- URL: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
- Endpoint: `/wp-json/jwt-auth/v1/token`

**Opción B: Simple JWT Login**
- URL: https://wordpress.org/plugins/simple-jwt-login/
- Endpoint: `/wp-json/simple-jwt-login/v1/auth`

### 2. Configuración del Plugin

Después de instalar el plugin:

1. Edita tu archivo `wp-config.php` y agrega:

```php
// JWT Authentication
define('JWT_AUTH_SECRET_KEY', 'tu-clave-secreta-super-segura');
define('JWT_AUTH_CORS_ENABLE', true);
```

2. Genera una clave secreta segura:
```bash
# En Linux/Mac
openssl rand -base64 64

# O usa un generador online: https://api.wordpress.org/secret-key/1.1/salt/
```

3. Verifica que el plugin funcione:
```bash
curl -X POST https://tu-sitio.com/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"username":"tu_usuario","password":"tu_contraseña"}'
```

Deberías recibir:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_email": "tu@email.com",
  "user_nicename": "tu_usuario",
  "user_display_name": "Tu Nombre"
}
```

---

## ⚙️ Configuración de Variables de Entorno

### Archivo `.env`

Agrega estas variables a tu archivo `.env`:

```env
# === WordPress Configuration ===

# URL de tu WordPress (sin barra final)
WP_URL=https://tu-wordpress.com

# Token JWT inicial (se renovará automáticamente)
WP_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# === NUEVAS: Para renovación automática ===

# Usuario de WordPress (con permisos de publicación)
WP_USERNAME=tu_usuario

# Contraseña de WordPress
WP_PASSWORD=tu_contraseña_segura

# === Opcional: Application Password (WordPress 5.6+) ===
# Si prefieres usar Application Passwords en lugar de la contraseña real:
# 1. Ve a Usuarios → Tu Perfil → Application Passwords
# 2. Crea una nueva contraseña de aplicación
# 3. Úsala como WP_PASSWORD
```

### Seguridad

⚠️ **IMPORTANTE**:
- **NUNCA** subas el archivo `.env` a Git
- Agrega `.env` a tu `.gitignore`
- Usa contraseñas fuertes
- Considera usar Application Passwords en lugar de la contraseña principal
- El usuario debe tener **permisos mínimos** necesarios (author/editor)

---

## 🚀 Uso en tu Código

### Método 1: Wrapper Completo (Recomendado)

Reemplaza tus llamadas `axios` con `makeAuthenticatedRequest`:

```javascript
// ❌ ANTES (sin renovación automática)
const axios = require('axios');

const response = await axios.put(
  `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
  { acf: { foto: mediaId } },
  {
    headers: {
      'Authorization': `Bearer ${WP_JWT}`,
      'Content-Type': 'application/json'
    }
  }
);

// ✅ DESPUÉS (con renovación automática)
const { makeAuthenticatedRequest } = require('../utils/wp-auth');

const response = await makeAuthenticatedRequest(
  `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
  {
    method: 'PUT',
    data: { acf: { foto: mediaId } },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  true // Usar axios
);
```

### Método 2: Solo Token (Código Legacy)

Si prefieres mantener tu código existente:

```javascript
const { getValidToken } = require('../utils/wp-auth');

// Obtener token válido (se renueva automáticamente si está expirado)
const token = await getValidToken();

// Usar con tu código existente
const response = await axios.put(
  `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
  { acf: { foto: mediaId } },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

## 📝 Archivos Actualizados

### `api/images/created_img.js`

Ya actualizado para usar `makeAuthenticatedRequest` en:
- ✅ Subida de imágenes a WordPress Media
- ✅ Sincronización con GCS
- ✅ Actualización de campos ACF

### Próximos Archivos a Actualizar

Puedes actualizar estos archivos siguiendo el mismo patrón:

1. `api/pedagogical-outputs/index.js`
2. `api/pedagogical-outputs/[id].js`
3. `api/pedagogical-outputs-logic/index.js`
4. `api/pedagogical-outputs-logic/[id].js`

---

## 🧪 Pruebas

### Probar Renovación Manual

```javascript
const { renewToken, getTokenStatus } = require('./utils/wp-auth');

// Ver estado actual del token
console.log(getTokenStatus());

// Forzar renovación
const newToken = await renewToken();
console.log('Nuevo token:', newToken);
```

### Probar Detección de Expiración

Puedes simular un token expirado modificando temporalmente `WP_JWT` en `.env`:

```env
# Token inválido para testing
WP_JWT=token_invalido_para_testing
```

Luego ejecuta cualquier endpoint - debería:
1. Detectar el error 401
2. Renovar automáticamente el token
3. Reintentar la petición
4. Completar exitosamente

---

## 🔍 Debugging

### Ver Estado del Token

```javascript
const { getTokenStatus } = require('./utils/wp-auth');

const status = getTokenStatus();
console.log('Token Status:', status);
// {
//   hasCache: true,
//   expiresAt: "2026-01-25T10:30:00.000Z",
//   needsRenewal: false,
//   timeUntilExpiration: 518400000 // milisegundos
// }
```

### Logs Automáticos

El módulo genera logs automáticos:

```
🔄 [wp-auth] Renovando token JWT...
✅ [wp-auth] Token renovado exitosamente
   Expira en: 25/1/2026 10:30:00

⚠️  [wp-auth] Token expirado detectado. Renovando y reintentando... (intento 1/1)
```

---

## ⚠️ Resolución de Problemas

### Error: "Credenciales de renovación no disponibles"

**Causa**: Faltan `WP_USERNAME` o `WP_PASSWORD` en `.env`

**Solución**:
```env
WP_USERNAME=tu_usuario
WP_PASSWORD=tu_contraseña
```

---

### Error: "No se pudo renovar el token JWT"

**Causas comunes**:

1. **Plugin JWT no instalado/configurado**
   - Verifica que el plugin esté activo
   - Verifica la configuración en `wp-config.php`

2. **Credenciales incorrectas**
   - Verifica usuario y contraseña
   - Intenta iniciar sesión en WordPress con las mismas credenciales

3. **Endpoint incorrecto**
   - Verifica qué plugin JWT tienes instalado
   - El módulo intenta ambos endpoints automáticamente

**Debug**:
```bash
# Prueba manual del endpoint
curl -X POST https://tu-sitio.com/wp-json/jwt-auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"username":"tu_usuario","password":"tu_contraseña"}'
```

---

### Error 403: "Sin permisos"

**Causa**: El usuario no tiene permisos suficientes

**Solución**:
- Usa un usuario con rol **Editor** o **Administrator**
- O configura permisos personalizados en WordPress

---

### El token se renueva demasiado seguido

**Causa**: El token expira muy rápido o hay problema con el cache

**Solución**:
1. Verifica la configuración del plugin JWT
2. Limpia el cache manualmente:
```javascript
const { clearTokenCache } = require('./utils/wp-auth');
clearTokenCache();
```

---

## 📊 Comparación: Antes vs Después

### ❌ Antes (Sin renovación automática)

```javascript
// Si el token expira durante la ejecución:
// ❌ Error 401
// ❌ Petición falla
// ❌ Requiere intervención manual
// ❌ Pérdida de datos/trabajo
```

### ✅ Después (Con renovación automática)

```javascript
// Si el token expira durante la ejecución:
// ✅ Detecta el error 401
// ✅ Renueva el token automáticamente
// ✅ Reintenta la petición
// ✅ Completa la operación exitosamente
// ✅ Todo es transparente para el usuario
```

---

## 📚 Ejemplos Completos

Ver archivo `utils/wp-auth-example.js` para ejemplos detallados de:

1. Peticiones con axios
2. Peticiones con fetch
3. Subida de archivos (FormData)
4. Múltiples peticiones en secuencia
5. Manejo de errores personalizado
6. Integración con código existente

---

## 🎯 Mejores Prácticas

1. **Siempre usa `makeAuthenticatedRequest`** para nuevas peticiones
2. **Usa Application Passwords** en lugar de contraseñas reales
3. **Monitorea los logs** para detectar renovaciones frecuentes
4. **Configura permisos mínimos** para el usuario de API
5. **Mantén las credenciales seguras** en `.env` (nunca en Git)

---

## 🔄 Migración de Código Existente

### Patrón de migración:

```javascript
// 1. Importar el módulo
const { makeAuthenticatedRequest } = require('../utils/wp-auth');

// 2. Buscar todas las llamadas axios/fetch con Authorization
// BUSCAR: axios.post|put|get + Authorization: Bearer

// 3. Reemplazar con makeAuthenticatedRequest
// - Cambiar axios.post/put/get por makeAuthenticatedRequest
// - Mover method a las options
// - Mover body/data a las options
// - Remover header Authorization (se agrega automáticamente)
// - Agregar tercer parámetro: true (para usar axios)

// 4. Probar el endpoint
// 5. ✅ Listo!
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Prueba el endpoint JWT manualmente con curl
4. Verifica que el plugin JWT esté configurado correctamente
5. Revisa los ejemplos en `wp-auth-example.js`

---

**Última actualización**: 2026-01-19  
**Módulo**: `utils/wp-auth.js`  
**Estado**: ✅ Producción




















