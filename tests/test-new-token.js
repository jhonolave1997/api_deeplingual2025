/**
 * Script para verificar que el nuevo token JWT funciona correctamente
 */

require('dotenv').config();
const axios = require('axios');

const WP_URL = 'https://twinkle.acuarelacore.com';
const NEW_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2OTExOTc4MywibmJmIjoxNzY5MTE5NzgzLCJleHAiOjE3Njk3MjQ1ODMsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.7oEOUMBDRwt1Xw4ljGQaPKn762qJOZl-Viud5ptIRmA';

async function testToken() {
  console.log('🧪 Verificando que el nuevo token JWT funciona...\n');

  try {
    console.log('📡 Haciendo petición autenticada a WordPress...');
    const response = await axios.get(
      `${WP_URL}/wp-json/wp/v2/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${NEW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('\n✅ Token verificado exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('INFORMACIÓN DEL USUARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${response.data.id}`);
    console.log(`Nombre: ${response.data.name}`);
    console.log(`Usuario: ${response.data.slug}`);
    console.log(`Email: ${response.data.email || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ El token está funcionando correctamente y tiene permisos válidos.\n');

  } catch (error) {
    console.error('\n❌ Error al verificar el token:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Datos:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n⚠️  El token no es válido o ha expirado.');
      }
    }
    throw error;
  }
}

testToken()
  .then(() => {
    console.log('✅ Verificación completada\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la verificación');
    process.exit(1);
  });











