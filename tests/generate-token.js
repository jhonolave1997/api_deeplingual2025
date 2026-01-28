/**
 * Script para generar un nuevo token JWT de WordPress
 */

require('dotenv').config();
const axios = require('axios');

// Credenciales proporcionadas
const WP_URL = 'https://twinkle.acuarelacore.com';
const WP_USERNAME = 'blngltrnng';
const WP_PASSWORD = 'ctRGh14sX9YrwTG';

async function generateToken() {
  console.log('🔄 Generando nuevo token JWT...\n');
  console.log(`URL: ${WP_URL}`);
  console.log(`Usuario: ${WP_USERNAME}\n`);

  try {
    // Intentar con el endpoint principal (jwt-auth)
    console.log('📡 Intentando con endpoint: /wp-json/jwt-auth/v1/token');
    const response = await axios.post(
      `${WP_URL}/wp-json/jwt-auth/v1/token`,
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

    if (response.data && response.data.token) {
      const token = response.data.token;
      
      console.log('\n✅ Token generado exitosamente!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('NUEVO TOKEN JWT:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(token);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (response.data.user_email) {
        console.log('📧 Email del usuario:', response.data.user_email);
      }
      if (response.data.user_display_name) {
        console.log('👤 Nombre:', response.data.user_display_name);
      }
      
      console.log('\n💡 Para usar este token, agrega a tu .env:');
      console.log(`WP_JWT="${token}"\n`);
      
      return token;
    } else {
      throw new Error('La respuesta no contiene un token');
    }

  } catch (error) {
    // Si el endpoint principal falla, intentar con el alternativo
    if (error.response?.status === 404) {
      console.log('\n⚠️  Endpoint principal no encontrado, intentando con endpoint alternativo...\n');
      console.log('📡 Intentando con endpoint: /wp-json/simple-jwt-login/v1/auth');
      
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
          const token = altResponse.data.jwt;
          
          console.log('\n✅ Token generado exitosamente (simple-jwt-login)!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('NUEVO TOKEN JWT:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(token);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          console.log('💡 Para usar este token, agrega a tu .env:');
          console.log(`WP_JWT="${token}"\n`);
          
          return token;
        }
      } catch (altError) {
        console.error('\n❌ Error en endpoint alternativo:', altError.message);
        if (altError.response) {
          console.error('   Status:', altError.response.status);
          console.error('   Datos:', JSON.stringify(altError.response.data, null, 2));
        }
        throw altError;
      }
    }

    // Si todo falla, mostrar el error
    console.error('\n❌ Error al generar token:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Datos:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Ejecutar
generateToken()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });











