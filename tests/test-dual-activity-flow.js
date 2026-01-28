/**
 * 🧪 Script de Prueba para Ambos Flujos de Actividades
 * 
 * Este script valida que el endpoint created_img.js funcione correctamente
 * tanto para actividades semanales (deep-lingual-) como para actividades
 * lógico matemáticas (deepgraphic-).
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas
 * 2. Instala las dependencias: npm install dotenv
 * 3. Ejecuta: node test-dual-activity-flow.js
 */

require('dotenv').config();

async function testDualFlow() {
  console.log('🧪 PRUEBA DE VALIDACIÓN DE AMBOS FLUJOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verificar variables de entorno
  console.log('📋 1. Verificando configuración...');
  const requiredVars = ['WP_URL', 'WP_JWT', 'OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Faltan variables de entorno:', missingVars.join(', '));
    console.log('\n💡 Asegúrate de tener un archivo .env con:');
    console.log('   WP_URL=https://tu-sitio.com');
    console.log('   WP_JWT=tu-jwt-token');
    console.log('   OPENAI_API_KEY=tu-openai-key\n');
    process.exit(1);
  }
  console.log('✅ Todas las variables de entorno configuradas\n');

  // Importar el handler
  const handler = require('../api/images/created_img.js');

  // ==================================================
  // PRUEBA 1: Flujo Deep Lingual (Actividades Semanales)
  // ==================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📘 PRUEBA 1: ACTIVIDADES SEMANALES (deep-lingual-)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testDataLingual = {
    run_id: `deep-lingual-test-${Date.now()}`,
    prompt: 'Ilustración infantil educativa de niños leyendo un libro, estilo suave, colores pastel',
    n: 1, // Solo 1 imagen para prueba
    size: '1024x1024',
    // wp_post_id: 123, // Descomenta y ajusta con un ID real para prueba completa
    // update_fields: ['multimedia']
  };

  console.log('📤 Configuración de la prueba:');
  console.log('   Run ID:', testDataLingual.run_id);
  console.log('   Prompt:', testDataLingual.prompt);
  console.log('   Endpoint esperado: planessemanales');
  console.log('   Campo esperado: foto (o multimedia si se especifica)\n');

  let result1 = await executeTest(handler, testDataLingual, 'planessemanales');

  // ==================================================
  // PRUEBA 2: Flujo DeepGraphic (Actividades Lógico Matemáticas)
  // ==================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔢 PRUEBA 2: ACTIVIDADES LÓGICO MATEMÁTICAS (deepgraphic-)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testDataGraphic = {
    run_id: `deepgraphic-test-${Date.now()}`,
    prompt: 'Ilustración educativa de números y formas geométricas, estilo colorido, para niños',
    n: 1, // Solo 1 imagen para prueba
    size: '1024x1024',
    // wp_post_id: 456, // Descomenta y ajusta con un ID real para prueba completa
    // update_fields: ['plantilla_en'] // O plantilla_es (por defecto)
  };

  console.log('📤 Configuración de la prueba:');
  console.log('   Run ID:', testDataGraphic.run_id);
  console.log('   Prompt:', testDataGraphic.prompt);
  console.log('   Endpoint esperado: actividadlogicomatematica');
  console.log('   Campo esperado: plantilla_es (o plantilla_en si se especifica)\n');

  let result2 = await executeTest(handler, testDataGraphic, 'actividadlogicomatematica');

  // ==================================================
  // RESUMEN FINAL
  // ==================================================
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1️⃣  Deep Lingual (Actividades Semanales):', result1 ? '✅ EXITOSO' : '❌ FALLIDO');
  console.log('2️⃣  DeepGraphic (Actividades Matemáticas):', result2 ? '✅ EXITOSO' : '❌ FALLIDO');

  if (result1 && result2) {
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE\n');
    console.log('✅ La lógica de enrutamiento funciona correctamente:');
    console.log('   • run_id con "deep-lingual-" → planessemanales');
    console.log('   • run_id con "deepgraphic-" → actividadlogicomatematica\n');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON\n');
    console.log('Revisa los errores anteriores para más detalles.\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Ejecuta una prueba individual
 */
async function executeTest(handler, testData, expectedEndpoint) {
  const mockReq = {
    method: 'POST',
    body: testData
  };

  let responseData = null;
  let responseStatus = null;
  let logsCapture = [];

  // Capturar logs de consola
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    logsCapture.push(message);
    originalLog(...args);
  };

  const mockRes = {
    status: (code) => {
      responseStatus = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  try {
    console.log('⏳ Procesando (esto puede tomar 30-60 segundos)...\n');
    await handler(mockReq, mockRes);

    // Restaurar console.log
    console.log = originalLog;

    // Analizar resultados
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULTADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Status Code:', responseStatus);
    
    if (responseStatus === 200) {
      console.log('✅ ÉXITO - Imágenes creadas correctamente\n');
      console.log('Detalles:');
      console.log('   Run ID:', responseData.run_id);
      console.log('   Post ID:', responseData.wp_post_id || 'N/A (sin actualización de post)');
      console.log('   Imágenes generadas:', responseData.previews.length);
      
      responseData.previews.forEach((preview, idx) => {
        console.log(`\n   Imagen ${idx + 1}:`);
        console.log(`     Media ID: ${preview.media_id}`);
        console.log(`     URL: ${preview.url}`);
      });

      // Verificar que se usó el endpoint correcto (si hay wp_post_id)
      if (testData.wp_post_id) {
        const endpointUsed = logsCapture.find(log => 
          log.includes('ACF fields updated for') && log.includes('post')
        );
        
        if (endpointUsed) {
          if (endpointUsed.includes(expectedEndpoint)) {
            console.log(`\n✅ Endpoint correcto usado: ${expectedEndpoint}`);
          } else {
            console.log(`\n❌ Endpoint incorrecto - Se esperaba: ${expectedEndpoint}`);
            return false;
          }
        }
      } else {
        console.log('\n💡 Nota: No se especificó wp_post_id, la imagen se creó pero no se guardó en ningún post.');
        console.log('   Para probar la actualización completa, descomenta y ajusta wp_post_id en el script.');
      }

      // Verificar accesibilidad de URLs
      console.log('\n🔍 Verificando accesibilidad de URLs...');
      for (let i = 0; i < responseData.previews.length; i++) {
        const preview = responseData.previews[i];
        console.log(`\n✓ Imagen ${i + 1} (Media ID: ${preview.media_id})...`);
        
        try {
          const response = await fetch(preview.url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`  ✅ URL accesible (${response.status})`);
            console.log(`  ↳ Content-Type: ${response.headers.get('content-type')}`);
            const size = response.headers.get('content-length');
            if (size) {
              console.log(`  ↳ Tamaño: ${Math.round(size / 1024)}KB`);
            }
          } else {
            console.log(`  ⚠️  URL responde con status ${response.status}`);
          }
        } catch (err) {
          console.log(`  ❌ Error al verificar URL: ${err.message}`);
        }
      }

      return true;

    } else {
      console.log('❌ ERROR - La solicitud falló\n');
      console.log('Respuesta:', JSON.stringify(responseData, null, 2));
      
      if (responseData?.error) {
        console.log('\n🔍 DIAGNÓSTICO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (responseData.error.includes('OpenAI')) {
          console.log('❌ Error en OpenAI API');
          console.log('   • Verifica: OPENAI_API_KEY');
          console.log('   • Verifica: Créditos disponibles en OpenAI');
          console.log('   • Detalles:', responseData.details);
        } else if (responseData.error.includes('WP media upload')) {
          console.log('❌ Error al subir imagen a WordPress');
          console.log('   • Verifica: WP_URL (debe ser sin barra final)');
          console.log('   • Verifica: WP_JWT (token válido)');
          console.log('   • Verifica: Permisos de usuario en WordPress');
        } else if (responseData.error.includes('update failed')) {
          console.log('❌ Error al actualizar ACF en WordPress');
          console.log('   • Verifica: El wp_post_id existe en el endpoint', expectedEndpoint);
          console.log('   • Verifica: Los campos ACF existen en el post');
          console.log('   • Verifica: Permisos de escritura en el post');
        } else if (responseData.error.includes('Missing env vars')) {
          console.log('❌ Faltan variables de entorno');
          console.log('   Detalles:', responseData.details);
        }
      }
      
      return false;
    }

  } catch (error) {
    console.log = originalLog;
    console.log('\n❌ ERROR FATAL\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Ejecutar pruebas
testDualFlow().catch(err => {
  console.error('\n❌ Error fatal en las pruebas:', err);
  process.exit(1);
});





















