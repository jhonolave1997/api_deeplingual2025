/**
 * 🧪 Script de Prueba para Creación de Imágenes
 * 
 * Este script prueba el endpoint de creación de imágenes
 * y verifica que el flujo completo funcione correctamente.
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas
 * 2. Instala las dependencias: npm install
 * 3. Ejecuta: node test-image-creation.js
 */

require('dotenv').config();

async function testImageCreation() {
  console.log('🧪 Iniciando pruebas de creación de imágenes\n');

  // Verificar variables de entorno
  console.log('📋 Verificando configuración...');
  const requiredVars = ['WP_URL', 'WP_JWT', 'OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('❌ Faltan variables de entorno:', missingVars.join(', '));
    process.exit(1);
  }
  console.log('✅ Todas las variables de entorno están configuradas\n');

  // Datos de prueba
  const testData = {
    run_id: `test-${Date.now()}`,
    prompt: 'Ilustración infantil educativa de un celular, superheroes y videojuegos imaginario, estilo suave, fondo claro',
    n: 1, // Solo 1 imagen para prueba rápida
    size: '1024x1024',
    // wp_post_id: 123, // Descomenta y ajusta si quieres probar con un post específico
    // update_fields: ['foto']
  };

  console.log('📤 Enviando solicitud de prueba...');
  console.log('   Run ID:', testData.run_id);
  console.log('   Prompt:', testData.prompt);
  console.log('   Imágenes:', testData.n);

  try {
    // Importar el handler
    const handler = require('../api/images/created_img.js');

    // Simular request y response
    const mockReq = {
      method: 'POST',
      body: testData
    };

    let responseData = null;
    let responseStatus = null;

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

    // Ejecutar handler
    console.log('\n⏳ Procesando (esto puede tomar 30-60 segundos)...\n');
    await handler(mockReq, mockRes);

    // Analizar resultados
    console.log('\n📊 RESULTADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Status Code:', responseStatus);
    
    if (responseStatus === 200) {
      console.log('✅ ÉXITO - Imágenes creadas correctamente\n');
      console.log('Detalles:');
      console.log('   Run ID:', responseData.run_id);
      console.log('   Post ID:', responseData.wp_post_id || 'N/A');
      console.log('   Imágenes generadas:', responseData.previews.length);
      
      responseData.previews.forEach((preview, idx) => {
        console.log(`\n   Imagen ${idx + 1}:`);
        console.log(`     Media ID: ${preview.media_id}`);
        console.log(`     URL: ${preview.url}`);
      });

      console.log('\n🔍 PRUEBAS DE VALIDACIÓN:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Verificar URLs
      for (let i = 0; i < responseData.previews.length; i++) {
        const preview = responseData.previews[i];
        console.log(`\n✓ Verificando imagen ${i + 1} (Media ID: ${preview.media_id})...`);
        
        try {
          const response = await fetch(preview.url, { method: 'HEAD' });
          if (response.ok) {
            console.log(`  ✅ URL accesible (${response.status})`);
            console.log(`  ↳ Content-Type: ${response.headers.get('content-type')}`);
            console.log(`  ↳ Content-Length: ${Math.round(response.headers.get('content-length') / 1024)}KB`);
          } else {
            console.log(`  ❌ URL no accesible (${response.status})`);
          }
        } catch (err) {
          console.log(`  ❌ Error al verificar URL: ${err.message}`);
        }
      }

    } else {
      console.log('❌ ERROR - La solicitud falló\n');
      console.log('Respuesta:', JSON.stringify(responseData, null, 2));
      
      if (responseData?.error) {
        console.log('\n🔍 DIAGNÓSTICO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (responseData.error.includes('OpenAI')) {
          console.log('❌ Error en OpenAI API');
          console.log('   Verifica: OPENAI_API_KEY');
          console.log('   Verifica: Créditos disponibles en OpenAI');
        } else if (responseData.error.includes('WP media upload')) {
          console.log('❌ Error al subir imagen a WordPress');
          console.log('   Verifica: WP_URL (debe ser sin barra final)');
          console.log('   Verifica: WP_JWT (token válido)');
          console.log('   Verifica: Permisos de usuario en WordPress');
        } else if (responseData.error.includes('Missing env vars')) {
          console.log('❌ Faltan variables de entorno');
          console.log('   Detalles:', responseData.details);
        }
      }
    }

  } catch (error) {
    console.log('\n❌ ERROR FATAL\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Prueba completada\n');
}

// Ejecutar pruebas
testImageCreation();

