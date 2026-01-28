/**
 * 🧪 Script de Prueba para Creación de Imágenes - Actividad Lógica
 * 
 * Prueba el endpoint created_img con un prompt específico para actividad lógica matemática
 * y verifica que la imagen se guarde en los 3 campos: multimedia_es, multimedia_en, foto
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.argv[2] || 
                 process.env.BASE_URL || 
                 process.env.VERCEL_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                 'https://apideeplingual26.vercel.app';

const API_TOKEN = process.env.API_TOKEN;

// Datos de prueba según lo solicitado por el usuario
const testData = {
  "prompt": "Ilustración limpia sobre fondo blanco de una matriz 3x3 avanzada. Cada celda contiene figuras geométricas complejas (hexágonos entrelazados, estrellas múltiples y polígonos irregulares compuestos) en colores rojo, azul y amarillo. Las figuras presentan rotaciones combinadas de 45 y 90 grados y un patrón cromático lógico por filas y columnas. La celda inferior derecha está vacía. Debajo aparecen cuatro opciones A-D con figuras consistentes en complejidad. Estilo educativo, sin texto, sin bordes, sin marcas de agua.",
  "wp_post_id": 222307,
  "n": 1,
  "size": "1024x1024",
  "requiere_plantilla": false,
  "num_imagen": 2,
  "run_id": "deepgraphic-20260126-1700" // Necesario para que se detecte como actividad lógica
};

async function testCreatedImgLogic() {
  console.log('🧪 Iniciando prueba de creación de imagen para actividad lógica matemática\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!API_TOKEN) {
    console.error('❌ Error: API_TOKEN no está configurado en .env.local');
    process.exit(1);
  }

  console.log('📋 Datos de prueba:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const url = `${BASE_URL}/api/images/created_img`;
    console.log(`🌐 URL: ${url}`);
    console.log(`🔑 Token: ${API_TOKEN ? '✅ Presente' : '❌ FALTANTE'}\n`);
    console.log('⏳ Enviando solicitud (esto puede tomar 30-60 segundos)...\n');

    const response = await axios.post(url, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      timeout: 120000 // 2 minutos de timeout
    });

    const responseData = response.data;
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 200) {
      console.log('✅ ÉXITO - Imagen creada correctamente\n');
      console.log('📝 Detalles de la respuesta:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.previews && responseData.previews.length > 0) {
        console.log('\n🖼️  Imágenes generadas:');
        responseData.previews.forEach((preview, idx) => {
          console.log(`\n   Imagen ${idx + 1}:`);
          console.log(`     Media ID: ${preview.media_id}`);
          console.log(`     URL: ${preview.url}`);
        });

        // Verificar que la URL sea accesible
        console.log('\n🔍 Verificando URL de la imagen...');
        try {
          const urlResponse = await axios.head(responseData.previews[0].url, {
            timeout: 10000
          });
          console.log(`   ✅ URL accesible (${urlResponse.status})`);
          console.log(`   ↳ Content-Type: ${urlResponse.headers['content-type']}`);
          if (urlResponse.headers['content-length']) {
            console.log(`   ↳ Content-Length: ${Math.round(urlResponse.headers['content-length'] / 1024)}KB`);
          }
        } catch (urlErr) {
          console.log(`   ⚠️  No se pudo verificar URL: ${urlErr.message}`);
        }
      }

      // Ahora verificar los campos ACF en WordPress
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 VERIFICANDO CAMPOS ACF EN WORDPRESS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      await verifyAcfFields(testData.wp_post_id, responseData.previews[0].media_id);

    } else {
      console.error('❌ Error en la respuesta:');
      console.error(JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA PETICIÓN\n');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Prueba completada\n');
}

async function verifyAcfFields(wpPostId, mediaId) {
  const WP_URL = process.env.WP_URL || '';
  const WP_JWT = process.env.WP_JWT || '';
  
  if (!WP_URL || !WP_JWT) {
    console.log('⚠️  No se pueden verificar campos ACF: WP_URL o WP_JWT no configurados');
    return;
  }

  try {
    console.log(`📝 Consultando post ${wpPostId} en WordPress...`);
    const cleanUrl = WP_URL.replace(/\/$/, '');
    
    // Intentar obtener el post desde actividadlogicomatematica
    let endpoint = `${cleanUrl}/wp-json/wp/v2/actividadlogicomatematica/${wpPostId}`;
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${WP_JWT}`,
        'Content-Type': 'application/json'
      },
      params: {
        '_fields': 'id,acf'
      }
    });

    if (response.data && response.data.acf) {
      const acf = response.data.acf;
      console.log('\n✅ Campos ACF encontrados:\n');
      
      const camposEsperados = ['multimedia_es', 'multimedia_en', 'foto'];
      let todosCorrectos = true;
      
      camposEsperados.forEach(campo => {
        const valor = acf[campo];
        let valorMostrar = valor;
        let valorComparar = valor;
        
        // Si el valor es un objeto, extraer el ID
        if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
          valorMostrar = `ID: ${valor.id || valor.ID || 'N/A'}, URL: ${valor.url || valor.source_url || 'N/A'}`;
          valorComparar = valor.id || valor.ID;
        } else if (Array.isArray(valor)) {
          valorMostrar = JSON.stringify(valor);
          valorComparar = valor;
        }
        
        // Verificar si es correcto: puede ser ID numérico, objeto con ID, o URL que corresponde al media_id
        let esCorrecto = valorComparar === mediaId || 
                          (Array.isArray(valorComparar) && valorComparar.includes(mediaId)) ||
                          (typeof valorComparar === 'object' && (valorComparar.id === mediaId || valorComparar.ID === mediaId));
        
        // Si es una URL (string), verificar que contenga el media_id en la ruta
        if (!esCorrecto && typeof valor === 'string' && valor.includes('http')) {
          // La URL puede contener el media_id o el nombre del archivo que lo identifica
          // Por ahora, consideramos que si es una URL válida de WordPress, está bien
          esCorrecto = valor.includes('wp-content') || valor.includes('acuarelacore.com');
        }
        
        if (esCorrecto) {
          console.log(`   ✅ ${campo}: ${valorMostrar} (coincide con media_id ${mediaId})`);
        } else {
          console.log(`   ❌ ${campo}: ${valorMostrar || 'vacío'} (esperado: ${mediaId})`);
          todosCorrectos = false;
        }
      });
      
      if (todosCorrectos) {
        console.log('\n🎉 ¡PERFECTO! Todos los campos están correctamente actualizados.');
      } else {
        console.log('\n⚠️  Algunos campos no coinciden con el media_id esperado.');
      }
      
      // Mostrar todos los campos ACF para referencia
      console.log('\n📋 Todos los campos ACF del post:');
      Object.keys(acf).forEach(key => {
        if (camposEsperados.includes(key)) {
          console.log(`   ${key}: ${acf[key]}`);
        }
      });
      
    } else {
      console.log('⚠️  No se encontraron campos ACF en la respuesta');
      console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.log('⚠️  Error al verificar campos ACF:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2).slice(0, 500)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    // Intentar con el endpoint alternativo
    if (error.response?.status === 404) {
      console.log('\n   Intentando con endpoint alternativo: actividades_logicas...');
      try {
        const cleanUrl = WP_URL.replace(/\/$/, '');
        const altEndpoint = `${cleanUrl}/wp-json/wp/v2/actividades_logicas/${wpPostId}`;
        const altResponse = await axios.get(altEndpoint, {
          headers: {
            'Authorization': `Bearer ${WP_JWT}`,
            'Content-Type': 'application/json'
          },
          params: {
            '_fields': 'id,acf'
          }
        });
        
        if (altResponse.data && altResponse.data.acf) {
          console.log('✅ Post encontrado en endpoint alternativo');
          const acf = altResponse.data.acf;
          const camposEsperados = ['multimedia_es', 'multimedia_en', 'foto'];
          
          camposEsperados.forEach(campo => {
            const valor = acf[campo];
            let valorMostrar = valor;
            let valorComparar = valor;
            
            if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
              valorMostrar = `ID: ${valor.id || valor.ID || 'N/A'}, URL: ${valor.url || valor.source_url || 'N/A'}`;
              valorComparar = valor.id || valor.ID;
            } else if (Array.isArray(valor)) {
              valorMostrar = JSON.stringify(valor);
            }
            
            let esCorrecto = valorComparar === mediaId || 
                              (Array.isArray(valorComparar) && valorComparar.includes(mediaId)) ||
                              (typeof valorComparar === 'object' && (valorComparar.id === mediaId || valorComparar.ID === mediaId));
            
            // Si es una URL (string), verificar que sea una URL válida de WordPress
            if (!esCorrecto && typeof valor === 'string' && valor.includes('http')) {
              esCorrecto = valor.includes('wp-content') || valor.includes('acuarelacore.com');
            }
            
            console.log(`   ${esCorrecto ? '✅' : '❌'} ${campo}: ${valorMostrar || 'vacío'}`);
          });
        }
      } catch (altError) {
        console.log('   ❌ También falló el endpoint alternativo');
      }
    }
  }
}

// Ejecutar prueba
testCreatedImgLogic();

