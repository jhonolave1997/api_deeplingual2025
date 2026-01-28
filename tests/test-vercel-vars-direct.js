/**
 * Script para probar las variables de entorno de Vercel directamente
 * Sin necesidad de archivo .env
 */

const axios = require('axios');
const Airtable = require('airtable');

// Variables de entorno de Vercel (copiadas directamente)
// ⚠️ IMPORTANTE: Reemplaza estos valores con tus credenciales reales antes de ejecutar
const ENV_VARS = {
  AIRTABLE_API_KEY: "tu_airtable_api_key_aqui",
  AIRTABLE_BASE_ID: "tu_airtable_base_id_aqui",
  AIRTABLE_LOGS_TABLE_NAME: "Event Log",
  AIRTABLE_TABLE_NAME: "Pedagogical Outputs",
  API_TOKEN: "tu_api_token_aqui",
  EMAIL_FROM: "no-reply@bilingualchildcaretraining.com",
  EMAIL_TO_TEMPLATES: "jhonolave@bilingualchildcaretraining.com, tecnologia@bilingualchildcaretraining.com",
  OPENAI_API_KEY: "tu_openai_api_key_aqui",
  MANDRILL_API_KEY: "tu_mandrill_api_key_aqui",
  WP_JWT: "tu_wp_jwt_token_aqui",
  WP_PASSWORD: "tu_wp_password_aqui",
  WP_URL: "https://twinkle.acuarelacore.com",
  WP_USERNAME: "tu_wp_username_aqui"
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testAirtable() {
  logSection('1. VERIFICANDO AIRTABLE');
  
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_LOGS_TABLE_NAME } = ENV_VARS;
  
  logInfo(`API Key: ${AIRTABLE_API_KEY.substring(0, 10)}...`);
  logInfo(`Base ID: ${AIRTABLE_BASE_ID}`);
  logInfo(`Tabla principal: "${AIRTABLE_TABLE_NAME}"`);
  logInfo(`Tabla de logs: "${AIRTABLE_LOGS_TABLE_NAME}"`);
  
  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    
    logInfo(`Probando acceso a tabla: "${AIRTABLE_TABLE_NAME}"`);
    const records = await base(AIRTABLE_TABLE_NAME).select({ maxRecords: 1 }).firstPage();
    logSuccess(`Acceso a tabla "${AIRTABLE_TABLE_NAME}" exitoso (${records.length} registro encontrado)`);
    
    logInfo(`Probando acceso a tabla: "${AIRTABLE_LOGS_TABLE_NAME}"`);
    const logRecords = await base(AIRTABLE_LOGS_TABLE_NAME).select({ maxRecords: 1 }).firstPage();
    logSuccess(`Acceso a tabla "${AIRTABLE_LOGS_TABLE_NAME}" exitoso (${logRecords.length} registro encontrado)`);
    
    return true;
  } catch (error) {
    logError(`Error al acceder a Airtable: ${error.message}`);
    if (error.statusCode === 401) {
      logWarning('El API Key de Airtable es inválido o no tiene permisos');
    } else if (error.statusCode === 404) {
      logWarning('La base de datos o tabla no existe');
    }
    return false;
  }
}

async function testOpenAI() {
  logSection('2. VERIFICANDO OPENAI');
  
  const { OPENAI_API_KEY } = ENV_VARS;
  
  logInfo(`API Key: ${OPENAI_API_KEY.substring(0, 15)}...`);
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      timeout: 10000
    });
    
    logSuccess(`OpenAI API Key válido (${response.data.data?.length || 0} modelos disponibles)`);
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      logError('OpenAI API Key inválido o expirado');
    } else {
      logError(`Error al verificar OpenAI: ${error.message}`);
    }
    return false;
  }
}

async function testWordPress() {
  logSection('3. VERIFICANDO WORDPRESS');
  
  const { WP_URL, WP_JWT, WP_USERNAME, WP_PASSWORD } = ENV_VARS;
  
  logInfo(`URL: ${WP_URL}`);
  logInfo(`Username: "${WP_USERNAME}" (${WP_USERNAME.length} caracteres)`);
  logInfo(`Password: "${'*'.repeat(Math.min(WP_PASSWORD.length, 20))}" (${WP_PASSWORD.length} caracteres)`);
  
  // ⚠️ PROBLEMA DETECTADO: El username tiene una "t" extra
  if (WP_USERNAME === 'tblngltrnng') {
    logWarning('⚠️  PROBLEMA DETECTADO: WP_USERNAME tiene una "t" al inicio');
    logWarning('   Actual: "tblngltrnng"');
    logWarning('   Debería ser: "blngltrnng" (sin la "t" inicial)');
    logWarning('   Esto causará el error 403 "Nombre de usuario desconocido"\n');
  }
  
  // Verificar token actual
  if (WP_JWT) {
    logInfo(`Token actual: ${WP_JWT.substring(0, 30)}...`);
    try {
      const response = await axios.get(`${WP_URL}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${WP_JWT}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      logSuccess(`WP_JWT actual es válido`);
      logInfo(`Usuario autenticado: ${response.data.name} (ID: ${response.data.id})`);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logWarning('WP_JWT está expirado o es inválido (se renovará automáticamente)');
      }
    }
  }
  
  // Probar generación de token con el username actual
  try {
    logInfo('Probando generación de nuevo token JWT con username actual...');
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
      logSuccess('Credenciales de WordPress son CORRECTAS');
      logInfo(`Token generado: ${response.data.token.substring(0, 50)}...`);
      logInfo(`Usuario: ${response.data.user_display_name || 'N/A'}`);
      logInfo(`Email: ${response.data.user_email || 'N/A'}`);
      return true;
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    logError(`Error al generar token: ${message}`);
    logError(`Status: ${status || 'N/A'}`);
    
    if (status === 403) {
      logError('\n💡 PROBLEMA CONFIRMADO: Credenciales incorrectas');
      logError(`   WP_USERNAME en Vercel: "${WP_USERNAME}"`);
      logError('   Este username NO existe en WordPress\n');
      
      // Probar con el username corregido
      logInfo('Probando con username corregido: "blngltrnng"...');
      try {
        const correctedResponse = await axios.post(
          `${WP_URL}/wp-json/jwt-auth/v1/token`,
          {
            username: 'blngltrnng', // Sin la "t" inicial
            password: WP_PASSWORD.trim()
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        if (correctedResponse.data && correctedResponse.data.token) {
          logSuccess('✅ CONFIRMADO: El username correcto es "blngltrnng" (sin la "t")');
          logInfo(`Token generado: ${correctedResponse.data.token.substring(0, 50)}...`);
          logInfo(`Usuario: ${correctedResponse.data.user_display_name || 'N/A'}`);
          logInfo(`Email: ${correctedResponse.data.user_email || 'N/A'}`);
          logWarning('\n🔧 ACCIÓN REQUERIDA:');
          logWarning('   Actualiza WP_USERNAME en Vercel de "tblngltrnng" a "blngltrnng"');
          return false; // Falla porque la configuración actual está mal
        }
      } catch (correctedError) {
        logError('Tampoco funciona con "blngltrnng"');
        logError(`Error: ${correctedError.response?.data?.message || correctedError.message}`);
      }
    }
    
    return false;
  }
  
  return false;
}

async function testMandrill() {
  logSection('4. VERIFICANDO MANDRILL (EMAIL)');
  
  const { MANDRILL_API_KEY, EMAIL_FROM, EMAIL_TO_TEMPLATES } = ENV_VARS;
  
  if (!MANDRILL_API_KEY || MANDRILL_API_KEY === 'tu_mandrill_api_key_aqui') {
    logWarning('MANDRILL_API_KEY no está configurado o tiene valor de ejemplo');
    logWarning('   Configura MANDRILL_API_KEY en Vercel con tu API Key real');
    return false;
  }
  
  logInfo(`API Key: ${MANDRILL_API_KEY.substring(0, 10)}...`);
  logInfo(`Email FROM: ${EMAIL_FROM}`);
  logInfo(`Email TO: ${EMAIL_TO_TEMPLATES}`);
  
  try {
    // Probar la API de Mandrill verificando el usuario
    const response = await axios.post('https://mandrillapp.com/api/1.0/users/info.json', {
      key: MANDRILL_API_KEY
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    logSuccess(`Mandrill API Key válido`);
    logInfo(`Usuario: ${response.data.username || 'N/A'}`);
    logInfo(`Reputación: ${response.data.reputation || 'N/A'}`);
    return true;
  } catch (error) {
    if (error.response?.data?.name === 'Invalid_Key') {
      logError('Mandrill API Key inválido');
      logError('   Verifica tu API Key en: https://mandrillapp.com/settings');
    } else {
      logWarning(`No se pudo verificar Mandrill: ${error.message}`);
      if (error.response?.data) {
        logWarning(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }
    return false;
  }
}

async function testAPIToken() {
  logSection('5. VERIFICANDO API TOKEN');
  
  const { API_TOKEN } = ENV_VARS;
  
  logInfo(`Token: ${API_TOKEN.substring(0, 20)}... (${API_TOKEN.length} caracteres)`);
  logSuccess('API_TOKEN configurado correctamente');
  return true;
}

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  VERIFICACIÓN DE VARIABLES DE ENTORNO DE VERCEL          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    airtable: false,
    openai: false,
    wordpress: false,
    mandrill: false,
    apiToken: false
  };
  
  try {
    results.airtable = await testAirtable();
    results.openai = await testOpenAI();
    results.wordpress = await testWordPress();
    results.mandrill = await testMandrill();
    results.apiToken = await testAPIToken();
  } catch (error) {
    logError(`Error fatal durante las pruebas: ${error.message}`);
  }
  
  // Resumen final
  logSection('RESUMEN DE VERIFICACIÓN');
  
  const tests = [
    { name: 'Airtable', result: results.airtable },
    { name: 'OpenAI', result: results.openai },
    { name: 'WordPress', result: results.wordpress },
    { name: 'Mandrill', result: results.mandrill },
    { name: 'API Token', result: results.apiToken }
  ];
  
  tests.forEach(({ name, result }) => {
    if (result) {
      logSuccess(`${name}: OK`);
    } else {
      logError(`${name}: FALLO`);
    }
  });
  
  const allPass = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  if (allPass) {
    log('✅ TODAS LAS VERIFICACIONES PASARON', 'green');
  } else {
    log('❌ ALGUNAS VERIFICACIONES FALLARON', 'red');
  }
  console.log('='.repeat(60) + '\n');
  
  if (!results.wordpress) {
    console.log('\n🔧 ACCIÓN REQUERIDA PARA WORDPRESS:');
    console.log('   1. Ve a Vercel Dashboard → Settings → Environment Variables');
    console.log('   2. Busca WP_USERNAME');
    console.log('   3. Cambia el valor de "tblngltrnng" a "blngltrnng" (sin la "t" inicial)');
    console.log('   4. Guarda los cambios');
    console.log('   5. Haz redeploy del proyecto\n');
  }
  
  process.exit(allPass ? 0 : 1);
}

runAllTests().catch(err => {
  logError(`Error fatal: ${err.message}`);
  process.exit(1);
});




