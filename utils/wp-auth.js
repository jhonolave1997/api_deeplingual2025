/**
 * 🔐 WordPress JWT Authentication Manager
 * 
 * Este módulo maneja automáticamente:
 * - Detección de tokens expirados (401/403)
 * - Renovación automática del JWT
 * - Reintento de peticiones con el nuevo token
 * - Cache del token en memoria
 * 
 * Uso:
 * ```javascript
 * const { makeAuthenticatedRequest, getValidToken } = require('./utils/wp-auth');
 * 
 * // Opción 1: Usar el wrapper (recomendado - maneja todo automáticamente)
 * const response = await makeAuthenticatedRequest(url, options);
 * 
 * // Opción 2: Solo obtener un token válido
 * const token = await getValidToken();
 * ```
 */

const axios = require('axios');

// Cache del token en memoria
let cachedToken = null;
let tokenExpirationTime = null;

/**
 * Obtiene las credenciales de renovación desde variables de entorno
 */
function getCredentials() {
  const WP_URL = (process.env.WP_URL || "").replace(/\/$/, "");
  const WP_USERNAME = (process.env.WP_USERNAME || "").trim();
  const WP_PASSWORD = (process.env.WP_PASSWORD || "").trim();
  const WP_JWT = (process.env.WP_JWT || "").trim();

  return {
    WP_URL,
    WP_USERNAME,
    WP_PASSWORD,
    WP_JWT
  };
}

/**
 * Renueva el JWT usando las credenciales de WordPress
 * 
 * @returns {Promise<string>} Nuevo token JWT
 * @throws {Error} Si no se pueden obtener las credenciales o falla la renovación
 */
async function renewToken() {
  const { WP_URL, WP_USERNAME, WP_PASSWORD } = getCredentials();

  if (!WP_URL) {
    throw new Error('WP_URL no está configurado en las variables de entorno');
  }

  if (!WP_USERNAME || !WP_PASSWORD) {
    console.warn('⚠️  WP_USERNAME y WP_PASSWORD no están configurados. No se puede renovar el token automáticamente.');
    console.warn('   Para habilitar la renovación automática, agrega estas variables al archivo .env:');
    console.warn('   WP_USERNAME=tu_usuario');
    console.warn('   WP_PASSWORD=tu_contraseña');
    throw new Error('Credenciales de renovación no disponibles (WP_USERNAME/WP_PASSWORD)');
  }

  console.log(`🔄 [wp-auth] Renovando token JWT...`);
  console.log(`   Usuario: ${WP_USERNAME ? WP_USERNAME.substring(0, 3) + '***' : 'NO CONFIGURADO'}`);
  console.log(`   URL: ${WP_URL}/wp-json/jwt-auth/v1/token`);

  try {
    // Intentar renovar usando JWT Authentication plugin
    // WordPress puede aceptar username o email, intentamos primero con username
    const response = await axios.post(
      `${WP_URL}/wp-json/jwt-auth/v1/token`,
      {
        username: WP_USERNAME.trim(), // Asegurar que no hay espacios
        password: WP_PASSWORD.trim()
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos timeout
      }
    );

    if (response.data && response.data.token) {
      const newToken = response.data.token;
      
      // Cachear el token
      cachedToken = newToken;
      
      // Calcular tiempo de expiración (típicamente 7 días, pero lo reducimos a 6 para seguridad)
      tokenExpirationTime = Date.now() + (6 * 24 * 60 * 60 * 1000); // 6 días
      
      console.log(`✅ [wp-auth] Token renovado exitosamente`);
      console.log(`   Expira en: ${new Date(tokenExpirationTime).toLocaleString()}`);
      
      return newToken;
    } else {
      throw new Error('Respuesta de renovación no contiene token');
    }

  } catch (error) {
    // Si el endpoint jwt-auth no existe, intentar con simple-jwt-login
    if (error.response?.status === 404) {
      console.log(`🔄 [wp-auth] Intentando con endpoint alternativo (simple-jwt-login)...`);
      
      try {
        const altResponse = await axios.post(
          `${WP_URL}/wp-json/simple-jwt-login/v1/auth`,
          {
            username: WP_USERNAME,
            password: WP_PASSWORD
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (altResponse.data && altResponse.data.jwt) {
          const newToken = altResponse.data.jwt;
          cachedToken = newToken;
          tokenExpirationTime = Date.now() + (6 * 24 * 60 * 60 * 1000);
          
          console.log(`✅ [wp-auth] Token renovado exitosamente (simple-jwt-login)`);
          return newToken;
        }
      } catch (altError) {
        console.error(`❌ [wp-auth] Error en endpoint alternativo:`, altError.message);
      }
    }

    // Si todo falla, lanzar error con detalles
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const responseData = error.response?.data;
    
    console.error(`❌ [wp-auth] Error al renovar token:`, message);
    console.error(`   Status: ${status || 'N/A'}`);
    console.error(`   URL: ${WP_URL}/wp-json/jwt-auth/v1/token`);
    console.error(`   Usuario configurado: ${WP_USERNAME ? `"${WP_USERNAME.trim()}" (${WP_USERNAME.trim().length} caracteres)` : 'NO CONFIGURADO'}`);
    
    // Mensajes de ayuda específicos según el error
    if (status === 403) {
      console.error(`\n   💡 SOLUCIÓN: Error 403 - Credenciales incorrectas`);
      console.error(`   Verifica en Vercel que las variables estén correctas:`);
      console.error(`   - WP_USERNAME debe ser el nombre de usuario EXACTO de WordPress`);
      console.error(`   - WP_PASSWORD debe ser la contraseña correcta o Application Password`);
      console.error(`   - Asegúrate de que no haya espacios al inicio/final`);
      console.error(`   - Si usas email, verifica que sea el email asociado al usuario\n`);
    } else if (status === 404) {
      console.error(`\n   💡 SOLUCIÓN: Error 404 - Plugin JWT no encontrado`);
      console.error(`   Verifica que el plugin "JWT Authentication for WP REST API" esté instalado y activo\n`);
    }
    
    throw new Error(`No se pudo renovar el token JWT: ${message}`);
  }
}

/**
 * Verifica si el token actual está cerca de expirar
 * 
 * @returns {boolean} true si el token necesita renovarse
 */
function tokenNeedsRenewal() {
  if (!cachedToken || !tokenExpirationTime) {
    return false; // No hay token en cache, usar el de .env
  }

  // Renovar si falta menos de 1 hora para expirar
  const oneHour = 60 * 60 * 1000;
  return Date.now() >= (tokenExpirationTime - oneHour);
}

/**
 * Obtiene un token JWT válido
 * 
 * ESTRATEGIA OPTIMIZADA:
 * - Si hay un token en cache y no ha expirado, lo retorna
 * - Si NO hay token en cache, RENUEVA INMEDIATAMENTE (no usa el de .env)
 * - Si el token en cache está cerca de expirar, lo renueva
 * 
 * Esto asegura que SIEMPRE tengamos un token fresco en memoria,
 * sin depender del WP_JWT viejo de las variables de entorno.
 * 
 * @param {boolean} forceRenewal - Forzar renovación del token
 * @returns {Promise<string>} Token JWT válido
 */
async function getValidToken(forceRenewal = false) {
  const { WP_JWT, WP_USERNAME, WP_PASSWORD } = getCredentials();

  // Si se fuerza renovación
  if (forceRenewal) {
    try {
      console.log(`🔄 [wp-auth] Forzando renovación de token...`);
      return await renewToken();
    } catch (error) {
      console.warn(`⚠️  [wp-auth] No se pudo renovar el token: ${error.message}`);
      console.warn(`   Usando token de .env como fallback`);
      return WP_JWT;
    }
  }

  // Si hay token en cache y aún no expira, usarlo
  if (cachedToken && !tokenNeedsRenewal()) {
    console.log(`✅ [wp-auth] Usando token en cache (válido por ${Math.round((tokenExpirationTime - Date.now()) / (1000 * 60 * 60))} horas)`);
    return cachedToken;
  }

  // Si el token necesita renovación
  if (tokenNeedsRenewal()) {
    console.log(`⚠️  [wp-auth] Token en cache cerca de expirar, renovando...`);
    try {
      return await renewToken();
    } catch (error) {
      console.warn(`⚠️  [wp-auth] No se pudo renovar el token. Usando token de .env`);
      return WP_JWT;
    }
  }

  // 🔥 NUEVO: Si NO hay cache, RENOVAR inmediatamente (no usar .env)
  // Esto asegura que SIEMPRE empecemos con un token fresco
  if (!cachedToken && WP_USERNAME && WP_PASSWORD) {
    console.log(`🔄 [wp-auth] No hay token en cache - Generando token fresco desde cero...`);
    try {
      return await renewToken();
    } catch (error) {
      console.warn(`⚠️  [wp-auth] No se pudo generar token fresco: ${error.message}`);
      console.warn(`   Usando token de .env como último recurso`);
      return WP_JWT;
    }
  }

  // Fallback final: usar el token de .env (solo si no hay credenciales)
  console.log(`⚠️  [wp-auth] Sin cache y sin credenciales - Usando token de .env`);
  return WP_JWT;
}

/**
 * Detecta si una respuesta indica que el token ha expirado
 * 
 * @param {object} error - Error de axios/fetch
 * @returns {boolean} true si el error es por token expirado
 */
function isTokenExpiredError(error) {
  const status = error.response?.status || error.status;
  
  // Debug: loguear información del error
  if (status === 401 || status === 403) {
    const message = error.response?.data?.message || error.message || '';
    const code = error.response?.data?.code || '';
    
    console.log(`🔍 [wp-auth] Analizando error ${status}:`, {
      message: message.slice(0, 100),
      code: code
    });
    
    // Mensajes comunes de JWT expirado
    const expiredMessages = [
      'jwt_auth_invalid_token',
      'jwt_auth_expired',
      'token_expired',
      'expired',
      'invalid_token',
      'rest_forbidden',
      'rest_cannot_create',
      'rest_cannot_edit',
      'authorization', // Más genérico
      'authentication' // Más genérico
    ];
    
    const hasExpiredMessage = expiredMessages.some(msg => 
      message.toLowerCase().includes(msg) || 
      code.toLowerCase().includes(msg)
    );
    
    // Si es 401/403, asumimos que es problema de token (más permisivo)
    // Solo en caso específico de otros errores no relacionados con auth, retornamos false
    if (hasExpiredMessage) {
      console.log(`✅ [wp-auth] Detectado como error de token expirado`);
      return true;
    }
    
    // Para cualquier 401, intentar renovación (más agresivo pero seguro)
    if (status === 401) {
      console.log(`⚠️  [wp-auth] 401 sin mensaje conocido, pero intentaremos renovar`);
      return true;
    }
  }
  
  return false;
}

/**
 * Realiza una petición autenticada con manejo automático de renovación de token
 * 
 * Esta función:
 * 1. Obtiene un token válido
 * 2. Realiza la petición
 * 3. Si falla por token expirado, renueva el token y reintenta
 * 
 * @param {string} url - URL completa de la petición
 * @param {object} options - Opciones de fetch/axios (method, body, headers, etc)
 * @param {boolean} useAxios - Si true, usa axios; si false, usa fetch nativo
 * @returns {Promise<Response|AxiosResponse>} Respuesta de la petición
 * 
 * @example
 * // Con fetch (por defecto)
 * const response = await makeAuthenticatedRequest(
 *   'https://wp.com/wp-json/wp/v2/posts',
 *   { method: 'POST', body: JSON.stringify({...}) }
 * );
 * 
 * // Con axios
 * const response = await makeAuthenticatedRequest(
 *   'https://wp.com/wp-json/wp/v2/posts',
 *   { method: 'POST', data: {...} },
 *   true
 * );
 */
async function makeAuthenticatedRequest(url, options = {}, useAxios = true) {
  const maxRetries = 1; // Solo un reintento después de renovar
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Obtener token válido (renovar si es el segundo intento)
      const token = await getValidToken(attempt > 0);

      if (useAxios) {
        // Usar axios
        const axiosConfig = {
          ...options,
          url,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`, // Por compatibilidad
          }
        };

        const response = await axios(axiosConfig);
        return response;

      } else {
        // Usar fetch nativo
        const fetchOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'X-Authorization': `Bearer ${token}`,
          }
        };

        const response = await fetch(url, fetchOptions);
        
        // Si es 401/403, lanzar error para que se capture y reintente
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          const errorData = await response.text();
          const error = new Error(`HTTP ${response.status}: ${errorData}`);
          error.response = { status: response.status, data: { message: errorData } };
          throw error;
        }
        
        return response;
      }

    } catch (error) {
      lastError = error;

      // Si es error de token expirado y aún tenemos reintentos
      if (isTokenExpiredError(error) && attempt < maxRetries) {
        console.log(`⚠️  [wp-auth] Token expirado detectado. Renovando y reintentando... (intento ${attempt + 1}/${maxRetries})`);
        
        // Invalidar cache para forzar renovación
        cachedToken = null;
        tokenExpirationTime = null;
        
        continue; // Reintentar
      }

      // Si no es error de token o ya no hay reintentos, lanzar el error
      throw error;
    }
  }

  // Si llegamos aquí, se agotaron los reintentos
  throw lastError;
}

/**
 * Limpia el cache del token (útil para testing o reset manual)
 */
function clearTokenCache() {
  cachedToken = null;
  tokenExpirationTime = null;
  console.log('🔄 [wp-auth] Cache de token limpiado');
}

/**
 * Obtiene información del estado actual del token
 * 
 * @returns {object} Estado del token
 */
function getTokenStatus() {
  return {
    hasCache: !!cachedToken,
    expiresAt: tokenExpirationTime ? new Date(tokenExpirationTime).toISOString() : null,
    needsRenewal: tokenNeedsRenewal(),
    timeUntilExpiration: tokenExpirationTime ? tokenExpirationTime - Date.now() : null
  };
}

// Exportar funciones públicas
module.exports = {
  getValidToken,
  renewToken,
  makeAuthenticatedRequest,
  clearTokenCache,
  getTokenStatus,
  isTokenExpiredError
};

