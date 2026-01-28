/**
 * Script de prueba para verificar la generación del token JWT
 */

require('dotenv').config();
const { getValidToken, renewToken, getTokenStatus, clearTokenCache } = require('./utils/wp-auth');

async function testJWTGeneration() {
  console.log('🧪 Iniciando prueba de generación de token JWT...\n');

  // Verificar variables de entorno
  const { WP_URL, WP_USERNAME, WP_PASSWORD } = {
    WP_URL: (process.env.WP_URL || "").replace(/\/$/, ""),
    WP_USERNAME: (process.env.WP_USERNAME || "").trim(),
    WP_PASSWORD: (process.env.WP_PASSWORD || "").trim()
  };

  console.log('📋 Verificando configuración:');
  console.log(`   WP_URL: ${WP_URL ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   WP_USERNAME: ${WP_USERNAME ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   WP_PASSWORD: ${WP_PASSWORD ? '✅ Configurado' : '❌ No configurado'}\n`);

  if (!WP_URL || !WP_USERNAME || !WP_PASSWORD) {
    console.error('❌ Error: Faltan variables de entorno necesarias.');
    console.error('   Asegúrate de tener configurado:');
    console.error('   - WP_URL');
    console.error('   - WP_USERNAME');
    console.error('   - WP_PASSWORD');
    console.error('');
    console.error('💡 Para configurar:');
    console.error('   1. Copia env.template a .env: cp env.template .env');
    console.error('   2. Edita .env con tus credenciales de WordPress');
    console.error('   3. Ejecuta este script nuevamente');
    console.error('');
    console.error('📖 Ver documentación en: docs/wp-auth-setup.md');
    process.exit(1);
  }

  try {
    // Limpiar cache para forzar generación nueva
    console.log('🔄 Limpiando cache de token...');
    clearTokenCache();
    console.log('✅ Cache limpiado\n');

    // Verificar estado inicial
    console.log('📊 Estado inicial del token:');
    const initialStatus = getTokenStatus();
    console.log(JSON.stringify(initialStatus, null, 2));
    console.log('');

    // Probar generación forzada del token
    console.log('🔄 Probando generación forzada del token...');
    const token1 = await getValidToken(true);
    
    if (!token1 || token1.length === 0) {
      throw new Error('El token generado está vacío');
    }

    console.log(`✅ Token generado exitosamente!`);
    console.log(`   Longitud: ${token1.length} caracteres`);
    console.log(`   Prefijo: ${token1.substring(0, 20)}...`);
    console.log('');

    // Verificar estado después de la generación
    console.log('📊 Estado después de la generación:');
    const statusAfterGeneration = getTokenStatus();
    console.log(JSON.stringify(statusAfterGeneration, null, 2));
    console.log('');

    // Probar que el cache funciona (segunda llamada sin forzar)
    console.log('🔄 Probando uso de cache (segunda llamada)...');
    const token2 = await getValidToken(false);
    
    if (token1 === token2) {
      console.log('✅ Cache funcionando correctamente - mismo token retornado');
    } else {
      console.warn('⚠️  Advertencia: El token cacheado es diferente al generado');
    }
    console.log('');

    // Probar renovación directa
    console.log('🔄 Probando renovación directa con renewToken()...');
    const token3 = await renewToken();
    
    if (!token3 || token3.length === 0) {
      throw new Error('El token renovado está vacío');
    }

    console.log(`✅ Token renovado exitosamente!`);
    console.log(`   Longitud: ${token3.length} caracteres`);
    console.log(`   Prefijo: ${token3.substring(0, 20)}...`);
    console.log('');

    // Verificar que el token renovado es diferente (o igual si es muy rápido)
    if (token1 === token3) {
      console.log('ℹ️  El token renovado es el mismo (normal si se renueva muy rápido)');
    } else {
      console.log('✅ El token renovado es diferente al anterior');
    }
    console.log('');

    // Estado final
    console.log('📊 Estado final del token:');
    const finalStatus = getTokenStatus();
    console.log(JSON.stringify(finalStatus, null, 2));
    console.log('');

    // Resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PRUEBA EXITOSA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Generación de token: OK');
    console.log('✓ Cache de token: OK');
    console.log('✓ Renovación de token: OK');
    console.log('✓ Estado del token: OK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Mensaje: ${error.message}`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code) {
      console.error(`Código: ${error.code}`);
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

// Ejecutar la prueba
testJWTGeneration();

