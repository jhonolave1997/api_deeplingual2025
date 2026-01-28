/**
 * 📚 EJEMPLOS DE USO - WordPress JWT Authentication Manager
 * 
 * Este archivo muestra cómo integrar wp-auth.js en tus endpoints existentes
 */

const { makeAuthenticatedRequest, getValidToken } = require('./wp-auth');
const axios = require('axios');

// ==========================================
// EJEMPLO 1: Actualizar usando axios (RECOMENDADO)
// ==========================================

async function example1_UsingAxiosWrapper() {
  const WP_URL = process.env.WP_URL;
  const postId = 123;

  try {
    // ✅ El wrapper maneja automáticamente la renovación del token
    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          acf: {
            foto: 456
          }
        }
      },
      true // Usar axios
    );

    console.log('✅ Post actualizado:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// ==========================================
// EJEMPLO 2: Actualizar usando fetch nativo
// ==========================================

async function example2_UsingFetch() {
  const WP_URL = process.env.WP_URL;
  const postId = 123;

  try {
    // ✅ También funciona con fetch nativo
    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acf: {
            foto: 456
          }
        })
      },
      false // Usar fetch nativo
    );

    const data = await response.json();
    console.log('✅ Post actualizado:', data);
    return data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// ==========================================
// EJEMPLO 3: Solo obtener token válido (para código legacy)
// ==========================================

async function example3_GetTokenOnly() {
  const WP_URL = process.env.WP_URL;
  
  try {
    // ✅ Obtener token válido (renueva automáticamente si está expirado)
    const token = await getValidToken();

    // Usar el token con tu código existente
    const response = await axios.put(
      `${WP_URL}/wp-json/wp/v2/planessemanales/123`,
      {
        acf: { foto: 456 }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Post actualizado:', response.data);
    return response.data;

  } catch (error) {
    // ⚠️ Con este método, debes manejar manualmente los errores de token expirado
    if (error.response?.status === 401) {
      console.error('❌ Token expirado - Necesitas implementar retry manual');
    }
    throw error;
  }
}

// ==========================================
// EJEMPLO 4: Integración en created_img.js
// ==========================================

async function example4_UpdateACFFields() {
  const { makeAuthenticatedRequest } = require('./utils/wp-auth');
  
  const WP_URL = (process.env.WP_URL || "").replace(/\/$/, "");
  const wp_post_id = 789;
  const media_id = 456;
  const endpoint = "planessemanales";
  const fields = ["foto"];

  const updatePayload = { acf: {} };
  for (const f of fields) updatePayload.acf[f] = media_id;

  try {
    // ✅ Usar makeAuthenticatedRequest en lugar de axios directamente
    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/${endpoint}/${wp_post_id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        data: updatePayload
      },
      true // Usar axios
    );

    console.log(`✅ ACF fields updated for ${endpoint} post ${wp_post_id}`);
    return response.data;

  } catch (error) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || error.message;
    console.error(`❌ ACF update failed for ${endpoint} post ${wp_post_id}: ${status}`);
    throw new Error(JSON.stringify(errorData).slice(0, 800));
  }
}

// ==========================================
// EJEMPLO 5: Subir archivo a WordPress Media
// ==========================================

async function example5_UploadMedia() {
  const { makeAuthenticatedRequest } = require('./utils/wp-auth');
  const FormData = require('form-data');
  
  const WP_URL = (process.env.WP_URL || "").replace(/\/$/, "");
  const form = new FormData();
  
  // Preparar FormData (ejemplo con buffer)
  const imageBuffer = Buffer.from('...'); // Tu imagen
  form.append("file", imageBuffer, {
    filename: "imagen.jpg",
    contentType: "image/jpeg"
  });
  form.append("title", "Mi Imagen");

  try {
    // ✅ makeAuthenticatedRequest maneja automáticamente los headers de FormData
    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/media`,
      {
        method: 'POST',
        data: form,
        headers: {
          ...form.getHeaders() // Importante: incluir headers de FormData
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      },
      true // Usar axios
    );

    console.log('✅ Media uploaded:', response.data.id);
    return response.data;

  } catch (error) {
    console.error('❌ Media upload failed:', error.message);
    throw error;
  }
}

// ==========================================
// EJEMPLO 6: Múltiples peticiones en secuencia
// ==========================================

async function example6_MultipleRequests() {
  const { makeAuthenticatedRequest } = require('./utils/wp-auth');
  const WP_URL = process.env.WP_URL;

  try {
    // 1. Crear post
    const createResponse = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/planessemanales`,
      {
        method: 'POST',
        data: {
          title: 'Nueva Actividad',
          status: 'draft'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      },
      true
    );

    const postId = createResponse.data.id;
    console.log('✅ Post creado:', postId);

    // 2. Actualizar ACF (el token se renueva automáticamente si expiró entre peticiones)
    const updateResponse = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/planessemanales/${postId}`,
      {
        method: 'PUT',
        data: {
          acf: {
            foto: 123
          }
        },
        headers: {
          'Content-Type': 'application/json'
        }
      },
      true
    );

    console.log('✅ ACF actualizado');
    return updateResponse.data;

  } catch (error) {
    console.error('❌ Error en secuencia:', error.message);
    throw error;
  }
}

// ==========================================
// EJEMPLO 7: Manejo de errores personalizado
// ==========================================

async function example7_ErrorHandling() {
  const { makeAuthenticatedRequest, getTokenStatus } = require('./utils/wp-auth');
  const WP_URL = process.env.WP_URL;

  try {
    // Verificar estado del token antes de la petición (opcional)
    const tokenStatus = getTokenStatus();
    console.log('📊 Token status:', tokenStatus);

    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/planessemanales/999999`,
      {
        method: 'GET'
      },
      true
    );

    return response.data;

  } catch (error) {
    // Identificar tipo de error
    if (error.response?.status === 404) {
      console.error('❌ Post no encontrado');
    } else if (error.response?.status === 401) {
      console.error('❌ No se pudo renovar el token - Verifica WP_USERNAME y WP_PASSWORD');
    } else if (error.response?.status === 403) {
      console.error('❌ Sin permisos - Verifica permisos del usuario');
    } else {
      console.error('❌ Error desconocido:', error.message);
    }
    throw error;
  }
}

// Exportar ejemplos
module.exports = {
  example1_UsingAxiosWrapper,
  example2_UsingFetch,
  example3_GetTokenOnly,
  example4_UpdateACFFields,
  example5_UploadMedia,
  example6_MultipleRequests,
  example7_ErrorHandling
};





















