/**
 * 🚨 SOLO PARA REFERENCIA - NO RECOMENDADO USAR
 * 
 * Actualizador de Variables de Entorno en Vercel
 * 
 * Este módulo muestra CÓMO actualizar variables de entorno en Vercel,
 * pero NO es necesario usarlo porque el cache en memoria funciona mejor.
 * 
 * Solo úsalo si tienes un caso de uso específico que lo requiera.
 */

const axios = require('axios');

/**
 * Actualiza una variable de entorno en Vercel
 * 
 * REQUISITOS:
 * - VERCEL_TOKEN: Token de API de Vercel (crear en: vercel.com/account/tokens)
 * - VERCEL_PROJECT_ID: ID del proyecto
 * - VERCEL_TEAM_ID: ID del equipo (opcional)
 * 
 * @param {string} key - Nombre de la variable (ej: "WP_JWT")
 * @param {string} value - Nuevo valor
 * @param {string} target - Entorno: "production", "preview", o "development"
 */
async function updateVercelEnvVar(key, value, target = 'production') {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_mO3aQDMH23CITtMGjOEMoMkOokum';
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_bMEtHu6W8A1r4WSPo4RnrD4h';

  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN no está configurado. Créalo en: https://vercel.com/account/tokens');
  }

  console.log(`📝 [vercel-env] Actualizando variable ${key} en Vercel...`);

  try {
    // 1. Obtener el env var ID actual
    const getUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
    
    const getResponse = await axios.get(getUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
      params: VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}
    });

    // Buscar la variable existente
    const existingVar = getResponse.data.envs?.find(env => env.key === key);

    if (existingVar) {
      // 2. Actualizar variable existente (PATCH)
      const updateUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}`;
      
      await axios.patch(
        updateUrl,
        {
          value,
          target: [target], // ["production", "preview", "development"]
          type: 'encrypted' // O 'plain' si no quieres encriptar
        },
        {
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}
        }
      );

      console.log(`✅ [vercel-env] Variable ${key} actualizada en Vercel`);
      console.log(`   Entorno: ${target}`);
      console.log(`   ⚠️  Nota: Puede requerir redeploy para aplicarse`);

    } else {
      // 3. Crear nueva variable (POST)
      const createUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`;
      
      await axios.post(
        createUrl,
        {
          key,
          value,
          target: [target],
          type: 'encrypted'
        },
        {
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
          },
          params: VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}
        }
      );

      console.log(`✅ [vercel-env] Variable ${key} creada en Vercel`);
    }

    return true;

  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;
    
    console.error(`❌ [vercel-env] Error al actualizar variable en Vercel:`, message);
    console.error(`   Status: ${status || 'N/A'}`);
    
    if (status === 401 || status === 403) {
      console.error(`   💡 Verifica que VERCEL_TOKEN sea válido y tenga permisos`);
    }
    
    throw error;
  }
}

/**
 * Integración con wp-auth.js (ejemplo - NO usar por defecto)
 * 
 * Esta función muestra cómo integrar la actualización en Vercel
 * con el sistema de renovación de JWT, pero NO es recomendado.
 */
async function renewTokenAndUpdateVercel() {
  const { renewToken } = require('./wp-auth');
  
  try {
    // 1. Renovar token JWT
    const newToken = await renewToken();
    console.log(`✅ Token JWT renovado`);
    
    // 2. Actualizar en Vercel (OPCIONAL - NO RECOMENDADO)
    if (process.env.VERCEL_TOKEN) {
      await updateVercelEnvVar('WP_JWT', newToken, 'production');
      console.log(`✅ Variable actualizada en Vercel`);
    } else {
      console.log(`ℹ️  VERCEL_TOKEN no configurado - saltando actualización en Vercel`);
      console.log(`   (Esto es normal - el cache en memoria es suficiente)`);
    }
    
    return newToken;
    
  } catch (error) {
    console.error(`❌ Error en renovación:`, error.message);
    throw error;
  }
}

module.exports = {
  updateVercelEnvVar,
  renewTokenAndUpdateVercel
};

// ============================================
// INSTRUCCIONES DE USO (Solo si lo necesitas)
// ============================================

/*

### 1. Crear Token de API en Vercel

1. Ve a: https://vercel.com/account/tokens
2. Click "Create Token"
3. Nombre: "API DeepLingual - Env Vars"
4. Scope: Selecciona tu equipo/proyecto
5. Permissions: "Full Access" o "Write"
6. Copia el token

### 2. Agregar a .env

```env
# Token de API de Vercel (opcional - solo si quieres actualizar env vars)
VERCEL_TOKEN=tu_token_aqui
VERCEL_PROJECT_ID=prj_mO3aQDMH23CITtMGjOEMoMkOokum
VERCEL_TEAM_ID=team_bMEtHu6W8A1r4WSPo4RnrD4h
```

### 3. Usar (NO RECOMENDADO - solo para casos especiales)

```javascript
const { renewTokenAndUpdateVercel } = require('./utils/vercel-env-updater');

// Renovar token Y actualizar Vercel
await renewTokenAndUpdateVercel();
```

### ⚠️  LIMITACIONES:

1. **Redeploy**: Cambios en env vars pueden requerir redeploy
2. **Latencia**: Agrega tiempo extra a cada renovación
3. **Rate Limits**: API de Vercel tiene límites de requests
4. **Complejidad**: Más cosas que pueden fallar
5. **Innecesario**: El cache en memoria funciona perfectamente

### ✅ RECOMENDACIÓN:

**NO uses este módulo**. El sistema de cache en memoria implementado
en wp-auth.js es más eficiente, más rápido, y más confiable.

Solo considera esto si tienes un caso de uso MUY específico donde
necesites que el token en Vercel esté siempre actualizado (poco probable).

*/





















