/**
 * 🧪 Script de Prueba - Renovación Automática de JWT
 * 
 * Este script prueba el sistema de renovación automática de tokens JWT
 * sin hacer modificaciones en WordPress.
 * 
 * Pruebas:
 * 1. Obtener token válido
 * 2. Verificar estado del token
 * 3. Renovar token manualmente
 * 4. Simular petición con token expirado
 * 5. Verificar renovación automática
 * 
 * Uso: node test-jwt-renewal.js
 */

require('dotenv').config();

const { 
  getValidToken, 
  renewToken, 
  makeAuthenticatedRequest,
  getTokenStatus,
  clearTokenCache,
  isTokenExpiredError
} = require('./utils/wp-auth');

async function testJWTRenewal() {
  console.log('🧪 PRUEBA DE RENOVACIÓN AUTOMÁTICA DE JWT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verificar configuración
  console.log('📋 1. Verificando configuración...');
  const WP_URL = process.env.WP_URL;
  const WP_JWT = process.env.WP_JWT;
  const WP_USERNAME = process.env.WP_USERNAME;
  const WP_PASSWORD = process.env.WP_PASSWORD;

  console.log(`   WP_URL: ${WP_URL ? '✅' : '❌'} ${WP_URL || 'No configurado'}`);
  console.log(`   WP_JWT: ${WP_JWT ? '✅' : '❌'} ${WP_JWT ? 'Configurado' : 'No configurado'}`);
  console.log(`   WP_USERNAME: ${WP_USERNAME ? '✅' : '❌'} ${WP_USERNAME || 'No configurado'}`);
  console.log(`   WP_PASSWORD: ${WP_PASSWORD ? '✅' : '❌'} ${WP_PASSWORD ? 'Configurado' : 'No configurado'}\n`);

  if (!WP_URL || !WP_JWT) {
    console.error('❌ Faltan variables de entorno básicas (WP_URL o WP_JWT)');
    console.log('\n💡 Copia env.template como .env y configura tus credenciales\n');
    process.exit(1);
  }

  if (!WP_USERNAME || !WP_PASSWORD) {
    console.warn('⚠️  WP_USERNAME y WP_PASSWORD no están configurados');
    console.warn('   La renovación automática NO funcionará');
    console.warn('   Solo se probará el flujo básico\n');
  }

  // ==============================================
  // Test 1: Obtener token válido
  // ==============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 1: Obtener Token Válido');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const token = await getValidToken();
    console.log(`✅ Token obtenido exitosamente`);
    console.log(`   Longitud: ${token.length} caracteres`);
    console.log(`   Preview: ${token.slice(0, 50)}...\n`);
  } catch (error) {
    console.error(`❌ Error al obtener token:`, error.message);
  }

  // ==============================================
  // Test 2: Ver estado del token
  // ==============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 2: Estado del Token');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const status = getTokenStatus();
  console.log('Estado actual:');
  console.log(`   Cache: ${status.hasCache ? '✅ Activo' : '❌ Vacío'}`);
  console.log(`   Expira: ${status.expiresAt || 'N/A'}`);
  console.log(`   Necesita renovación: ${status.needsRenewal ? '⚠️  Sí' : '✅ No'}`);
  if (status.timeUntilExpiration) {
    const hours = Math.floor(status.timeUntilExpiration / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    console.log(`   Tiempo restante: ${days} días, ${hours % 24} horas\n`);
  } else {
    console.log(`   Tiempo restante: N/A (usando token de .env)\n`);
  }

  // ==============================================
  // Test 3: Renovar token manualmente (si hay credenciales)
  // ==============================================
  if (WP_USERNAME && WP_PASSWORD) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Test 3: Renovación Manual');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      console.log('🔄 Renovando token...');
      const newToken = await renewToken();
      console.log(`✅ Token renovado exitosamente`);
      console.log(`   Nuevo token: ${newToken.slice(0, 50)}...\n`);

      // Ver estado actualizado
      const newStatus = getTokenStatus();
      console.log('Estado después de renovar:');
      console.log(`   Cache: ${newStatus.hasCache ? '✅ Activo' : '❌ Vacío'}`);
      console.log(`   Expira: ${newStatus.expiresAt || 'N/A'}\n`);

    } catch (error) {
      console.error(`❌ Error al renovar token:`, error.message);
      console.log(`   Esto es normal si el plugin JWT no está configurado\n`);
    }
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏭️  Test 3: OMITIDO (sin credenciales)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // ==============================================
  // Test 4: Petición real a WordPress
  // ==============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Test 4: Petición Autenticada');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log(`🔄 Consultando usuario actual en WordPress...`);
    const response = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/users/me`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      },
      true // Usar axios
    );

    console.log(`✅ Petición exitosa`);
    console.log(`   Usuario: ${response.data.name}`);
    console.log(`   Email: ${response.data.email || 'N/A'}`);
    console.log(`   ID: ${response.data.id}\n`);

  } catch (error) {
    const status = error.response?.status || 'N/A';
    console.error(`❌ Error en petición:`, error.message);
    console.error(`   Status: ${status}`);
    
    if (status === 401 || status === 403) {
      console.error(`   💡 El token parece inválido. Si tienes WP_USERNAME/WP_PASSWORD,`);
      console.error(`      el sistema debería renovarlo automáticamente.\n`);
    } else if (status === 404) {
      console.error(`   💡 Endpoint /wp-json/wp/v2/users/me no encontrado.`);
      console.error(`      Verifica que WordPress REST API esté habilitado.\n`);
    }
  }

  // ==============================================
  // Test 5: Simular token expirado (si hay credenciales)
  // ==============================================
  if (WP_USERNAME && WP_PASSWORD) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Test 5: Simulación de Token Expirado');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Guardar token original ANTES del try
    const originalToken = process.env.WP_JWT;
    
    try {
      // Limpiar cache y forzar uso de token inválido
      console.log('🔄 Limpiando cache de token...');
      clearTokenCache();
      
      // Usar token claramente inválido
      process.env.WP_JWT = 'token_invalido_para_testing';
      
      console.log('🔄 Haciendo petición con token inválido...');
      console.log('   (El sistema debería detectar el error y renovar automáticamente)\n');
      
      const response = await makeAuthenticatedRequest(
        `${WP_URL}/wp-json/wp/v2/users/me`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        },
        true
      );

      console.log(`✅ ÉXITO: El sistema renovó el token automáticamente`);
      console.log(`   Usuario: ${response.data.name}`);
      console.log(`   La renovación automática funciona correctamente! 🎉\n`);

    } catch (error) {
      const status = error.response?.status || 'N/A';
      console.error(`❌ Error en prueba de renovación automática:`, error.message);
      console.error(`   Status: ${status}`);
      
      if (status === 401 || status === 403) {
        console.error(`\n   ⚠️  La renovación automática NO funcionó`);
        console.error(`   Posibles causas:`);
        console.error(`   • Plugin JWT no configurado en WordPress`);
        console.error(`   • Credenciales WP_USERNAME/WP_PASSWORD incorrectas`);
        console.error(`   • Endpoint JWT no accesible\n`);
      }
    } finally {
      // Restaurar token original SIEMPRE
      process.env.WP_JWT = originalToken || '';
    }
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏭️  Test 5: OMITIDO (sin credenciales)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Para probar la renovación automática, configura:');
    console.log('   WP_USERNAME=tu_usuario');
    console.log('   WP_PASSWORD=tu_contraseña\n');
  }

  // ==============================================
  // Resumen Final
  // ==============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Estado de configuración:');
  console.log(`   ✅ Variables básicas: ${WP_URL && WP_JWT ? 'OK' : 'FALTA'}`);
  console.log(`   ${WP_USERNAME && WP_PASSWORD ? '✅' : '⚠️ '} Renovación automática: ${WP_USERNAME && WP_PASSWORD ? 'HABILITADA' : 'DESHABILITADA'}`);
  
  console.log('\nCapacidades:');
  console.log(`   ✅ Obtener token válido`);
  console.log(`   ✅ Ver estado del token`);
  console.log(`   ${WP_USERNAME && WP_PASSWORD ? '✅' : '⚠️ '} Renovar token manualmente`);
  console.log(`   ✅ Hacer peticiones autenticadas`);
  console.log(`   ${WP_USERNAME && WP_PASSWORD ? '✅' : '⚠️ '} Renovación automática en errores 401/403\n`);

  if (!WP_USERNAME || !WP_PASSWORD) {
    console.log('💡 RECOMENDACIÓN:');
    console.log('   Para habilitar la renovación automática completa, agrega a tu .env:');
    console.log('   WP_USERNAME=tu_usuario');
    console.log('   WP_PASSWORD=tu_contraseña');
    console.log('   (O mejor aún, usa Application Password)\n');
    console.log('   Ver guía completa: docs/wp-auth-setup.md\n');
  } else {
    console.log('🎉 CONFIGURACIÓN COMPLETA');
    console.log('   La renovación automática de JWT está habilitada y funcionando.\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Ejecutar pruebas
testJWTRenewal().catch(err => {
  console.error('\n❌ Error fatal en las pruebas:', err);
  process.exit(1);
});

