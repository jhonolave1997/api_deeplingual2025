# 🔐 Renovación Automática de Tokens JWT

## ✅ Confirmación: SÍ, todos los endpoints renuevan tokens automáticamente

Todos los agentes (creación de actividades e imágenes) tienen **doble protección** para manejar tokens JWT expirados:

1. **Renovación Preventiva** - Al inicio de cada operación
2. **Renovación Reactiva** - Si detectan un token expirado durante la operación

---

## 🛡️ Protección en cada endpoint

### 1. **POST `/api/pedagogical-outputs`** (Actividades Curriculares)

```javascript
// Línea 798-801
const { getValidToken } = require("../../utils/wp-auth");
console.log(`🔐 [${data.run_id}] Pre-renovando JWT antes de guardar en WordPress...`);
await getValidToken(); // Renueva si está cerca de expirar o ya expiró
console.log(`✅ [${data.run_id}] Token JWT verificado y listo`);

// Todas las peticiones usan makeAuthenticatedRequest (renovación automática)
const createResp = await makeAuthenticatedRequest(endpoint, {...});
const patchResp = await makeAuthenticatedRequest(updateEndpoint, {...});
```

### 2. **POST `/api/pedagogical-outputs-logic`** (Actividades Lógicas)

```javascript
// Línea 805-808
const { getValidToken } = require("../../utils/wp-auth");
console.log(`🔐 [${data.run_id}] Pre-renovando JWT antes de guardar en WordPress...`);
await getValidToken(); // Renueva si está cerca de expirar o ya expiró
console.log(`✅ [${data.run_id}] Token JWT verificado y listo`);

// Todas las peticiones usan makeAuthenticatedRequest (renovación automática)
const createResp = await makeAuthenticatedRequest(endpoint, {...});
const patchResp = await makeAuthenticatedRequest(updateEndpoint, {...});
```

### 3. **POST `/api/images/created_img`** (Generación de Imágenes)

```javascript
// Línea 31-36
// 🔄 PASO 0: RENOVAR JWT TOKEN ANTES DE TODO
const { getValidToken } = require("../../utils/wp-auth");
const run_id_temp = req.body?.run_id || "unknown";

console.log(`🔐 [${run_id_temp}] PASO 0: Renovando JWT token ANTES de procesar solicitud...`);
await getValidToken(); // Renueva si está cerca de expirar o ya expiró
console.log(`✅ [${run_id_temp}] JWT token renovado/verificado - Listo para procesar`);

// Todas las peticiones usan makeAuthenticatedRequest (renovación automática)
wpResp = await makeAuthenticatedRequest(`${WP_URL}/wp-json/wp/v2/media`, {...});
await makeAuthenticatedRequest(updateUrl, {...});
```

---

## 🔄 Cómo funciona la renovación automática

### Estrategia 1: Renovación Preventiva (`getValidToken()`)

Se ejecuta **al inicio** de cada operación:

```javascript
async function getValidToken(forceRenewal = false) {
  // 1. Si hay token en cache y aún no expira, usarlo
  if (cachedToken && !tokenNeedsRenewal()) {
    return cachedToken;
  }

  // 2. Si el token necesita renovación, renovarlo
  if (tokenNeedsRenewal()) {
    return await renewToken();
  }

  // 3. Si NO hay cache, RENOVAR inmediatamente (no usar .env)
  if (!cachedToken && WP_USERNAME && WP_PASSWORD) {
    return await renewToken();
  }

  // 4. Fallback: usar token de .env
  return WP_JWT;
}
```

**Ventajas:**
- ✅ Renueva **antes** de que expire (1 hora antes)
- ✅ Evita errores 401/403
- ✅ Proceso más rápido

### Estrategia 2: Renovación Reactiva (`makeAuthenticatedRequest()`)

Se ejecuta **si detecta un error 401/403**:

```javascript
async function makeAuthenticatedRequest(url, options = {}, useAxios = true) {
  const maxRetries = 1; // Un reintento después de renovar

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Obtener token válido
      const token = await getValidToken(attempt > 0);
      
      // Realizar petición
      const response = await axios(url, {...});
      return response;

    } catch (error) {
      // Si es error de token expirado, renovar y reintentar
      if (isTokenExpiredError(error) && attempt < maxRetries) {
        console.log(`⚠️  [wp-auth] Token expirado detectado. Renovando y reintentando...`);
        
        // Invalidar cache para forzar renovación
        cachedToken = null;
        tokenExpirationTime = null;
        
        continue; // Reintentar con nuevo token
      }
      
      throw error;
    }
  }
}
```

**Ventajas:**
- ✅ Detecta errores 401/403 automáticamente
- ✅ Renueva el token y reintenta la petición
- ✅ Transparente para el agente (no necesita manejar el error)

---

## 🎯 Detección de Token Expirado

La función `isTokenExpiredError()` detecta múltiples indicadores:

```javascript
function isTokenExpiredError(error) {
  const status = error.response?.status || error.status;
  
  // Detecta errores 401/403
  if (status === 401 || status === 403) {
    const message = error.response?.data?.message || '';
    const code = error.response?.data?.code || '';
    
    // Mensajes comunes de JWT expirado
    const expiredMessages = [
      'jwt_auth_invalid_token',
      'jwt_auth_expired',
      'token_expired',
      'rest_forbidden',
      'rest_cannot_create',
      'rest_cannot_edit',
      // ... más mensajes
    ];
    
    // Si coincide con algún mensaje, es token expirado
    if (expiredMessages.some(msg => 
      message.toLowerCase().includes(msg) || 
      code.toLowerCase().includes(msg)
    )) {
      return true;
    }
    
    // Para cualquier 401, intentar renovación (más agresivo pero seguro)
    if (status === 401) {
      return true;
    }
  }
  
  return false;
}
```

---

## 📋 Flujo Completo de Renovación

### Escenario 1: Token válido
```
1. Agente llama endpoint
2. getValidToken() verifica → Token OK, lo usa
3. makeAuthenticatedRequest() → Petición exitosa
4. ✅ Actividad guardada correctamente
```

### Escenario 2: Token cerca de expirar (preventivo)
```
1. Agente llama endpoint
2. getValidToken() verifica → Token expira en <1 hora
3. renewToken() → Genera nuevo token
4. makeAuthenticatedRequest() → Petición exitosa con nuevo token
5. ✅ Actividad guardada correctamente
```

### Escenario 3: Token expirado (reactivo)
```
1. Agente llama endpoint
2. getValidToken() verifica → Token expirado, intenta renovar
3. makeAuthenticatedRequest() → Petición falla con 401
4. isTokenExpiredError() detecta → Es token expirado
5. renewToken() → Genera nuevo token
6. makeAuthenticatedRequest() → Reintenta con nuevo token
7. ✅ Actividad guardada correctamente
```

---

## ⚙️ Requisitos para Renovación Automática

Para que la renovación automática funcione, necesitas en `.env.local`:

```env
# Requerido para renovación automática
WP_USERNAME=tu_usuario_exacto_de_wordpress
WP_PASSWORD=tu_contraseña_o_application_password

# Opcional (se renueva automáticamente si está expirado)
WP_JWT=token_actual_o_expirado
```

**Nota:** Si `WP_USERNAME` y `WP_PASSWORD` no están configurados, el sistema usará el `WP_JWT` de `.env.local` pero **no podrá renovarlo automáticamente** si expira.

---

## ✅ Conclusión

**SÍ, es completamente seguro.** Todos los agentes:

1. ✅ Renuevan el token **preventivamente** al inicio
2. ✅ Detectan tokens expirados **automáticamente** durante la operación
3. ✅ Renuevan y reintentan **transparentemente** si falla
4. ✅ No requieren intervención manual del agente

**Los agentes pueden funcionar incluso si el token JWT en `.env.local` está expirado**, siempre que `WP_USERNAME` y `WP_PASSWORD` estén configurados correctamente.

