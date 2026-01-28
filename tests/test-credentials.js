/**
 * Script para probar las credenciales de WordPress
 * Útil para verificar que WP_USERNAME y WP_PASSWORD son correctos
 */

require('dotenv').config();
const axios = require('axios');

const WP_URL = (process.env.WP_URL || "").replace(/\/$/, "");
const WP_USERNAME = (process.env.WP_USERNAME || "").trim();
const WP_PASSWORD = (process.env.WP_PASSWORD || "").trim();

async function testCredentials() {
  console.log('🧪 Probando credenciales de WordPress...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CONFIGURACIÓN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`URL: ${WP_URL || '❌ NO CONFIGURADO'}`);
  console.log(`Username: ${WP_USERNAME ? `"${WP_USERNAME}" (${WP_USERNAME.length} caracteres)` : '❌ NO CONFIGURADO'}`);
  console.log(`Password: ${WP_PASSWORD ? `"${'*'.repeat(Math.min(WP_PASSWORD.length, 20))}" (${WP_PASSWORD.length} caracteres)` : '❌ NO CONFIGURADO'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!WP_URL) {
    console.error('❌ WP_URL no está configurado');
    console.error('   Agrega WP_URL a tu archivo .env');
    process.exit(1);
  }

  if (!WP_USERNAME || !WP_PASSWORD) {
    console.error('❌ WP_USERNAME o WP_PASSWORD no están configurados');
    console.error('   Agrega estas variables a tu archivo .env:');
    console.error('   WP_USERNAME=tu_usuario');
    console.error('   WP_PASSWORD=tu_contraseña');
    process.exit(1);
  }

  // Verificar si hay espacios sospechosos
  if (WP_USERNAME !== WP_USERNAME.trim()) {
    console.warn('⚠️  ADVERTENCIA: WP_USERNAME tiene espacios al inicio o final');
    console.warn(`   Original: "${WP_USERNAME}"`);
    console.warn(`   Trimmed: "${WP_USERNAME.trim()}"`);
    console.warn('   Usaremos la versión sin espacios\n');
  }

  try {
    console.log('🔄 Intentando autenticar con WordPress...\n');
    console.log(`Endpoint: ${WP_URL}/wp-json/jwt-auth/v1/token`);
    
    const response = await axios.post(
      `${WP_URL}/wp-json/jwt-auth/v1/token`,
      {
        username: WP_USERNAME.trim(),
        password: WP_PASSWORD.trim()
      },
      {
        headers: { 
          'Content-Type': 'application/json' 
        },
        timeout: 10000
      }
    );

    if (response.data && response.data.token) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ CREDENCIALES CORRECTAS!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`Token generado: ${response.data.token.substring(0, 50)}...`);
      console.log(`Longitud: ${response.data.token.length} caracteres`);
      console.log(`Usuario: ${response.data.user_display_name || 'N/A'}`);
      console.log(`Email: ${response.data.user_email || 'N/A'}`);
      console.log(`Username: ${response.data.user_nicename || 'N/A'}\n`);
      console.log('✅ Las credenciales funcionan correctamente!');
      console.log('   Puedes usar estas mismas credenciales en Vercel\n');
    } else {
      console.error('❌ La respuesta no contiene un token');
      console.error('Respuesta:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR AL AUTENTICAR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const code = error.response?.data?.code || '';
    
    console.error(`Mensaje: ${message}`);
    console.error(`Status: ${status || 'N/A'}`);
    console.error(`Código: ${code || 'N/A'}\n`);
    
    if (status === 403) {
      console.error('💡 SOLUCIÓN: Error 403 - Credenciales incorrectas\n');
      console.error('Verifica:');
      console.error(`  1. WP_USERNAME: "${WP_USERNAME}"`);
      console.error('     - Debe ser el nombre de usuario EXACTO de WordPress');
      console.error('     - Sin espacios al inicio o final');
      console.error('     - Puede ser el username o el email\n');
      console.error(`  2. WP_PASSWORD: "${'*'.repeat(Math.min(WP_PASSWORD.length, 20))}"`);
      console.error('     - Debe ser la contraseña correcta');
      console.error('     - O un Application Password válido');
      console.error('     - Sin espacios al inicio o final\n');
      console.error('Pasos para corregir:');
      console.error('  1. Inicia sesión en WordPress Admin');
      console.error('  2. Ve a Usuarios → Tu Perfil');
      console.error('  3. Anota el "Nombre de usuario" EXACTO');
      console.error('  4. Crea un Application Password (recomendado)');
      console.error('  5. Actualiza las variables en Vercel\n');
    } else if (status === 404) {
      console.error('💡 SOLUCIÓN: Error 404 - Plugin JWT no encontrado\n');
      console.error('Verifica que el plugin "JWT Authentication for WP REST API"');
      console.error('esté instalado y activo en WordPress\n');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('💡 SOLUCIÓN: Error de conexión\n');
      console.error('Verifica que WP_URL sea correcto:');
      console.error(`  Actual: ${WP_URL}`);
      console.error('  Debe ser la URL completa sin barra final\n');
    }
    
    if (error.response?.data) {
      console.error('Respuesta completa del servidor:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testCredentials();











