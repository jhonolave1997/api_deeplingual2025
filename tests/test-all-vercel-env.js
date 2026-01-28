/**
 * Script para probar todas las variables de entorno de Vercel
 * Verifica que todas las credenciales y configuraciones funcionen correctamente
 */

require('dotenv').config();
const axios = require('axios');
const Airtable = require('airtable');

// Colores para la consola
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

// Cargar variables de entorno
const ENV_VARS = {
  // Airtable
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY?.trim(),
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID?.trim(),
  AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME?.trim() || 'Pedagogical Outputs',
  AIRTABLE_LOGS_TABLE_NAME: process.env.AIRTABLE_LOGS_TABLE_NAME?.trim() || 'Event Log',
  
  // API
  API_TOKEN: process.env.API_TOKEN?.trim(),
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim(),
  
  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
  EMAIL_FROM: process.env.EMAIL_FROM?.trim(),
  EMAIL_TO_TEMPLATES: process.env.EMAIL_TO_TEMPLATES?.trim(),
  
  // WordPress
  WP_URL: (process.env.WP_URL || '').replace(/\/$/, ''),
  WP_JWT: process.env.WP_JWT?.trim(),
  WP_USERNAME: process.env.WP_USERNAME?.trim(),
  WP_PASSWORD: process.env.WP_PASSWORD?.trim(),
  
  // Vercel (opcional)
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN?.trim(),
};

async function testAirtable() {
  logSection('1. VERIFICANDO AIRTABLE');
  
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_LOGS_TABLE_NAME } = ENV_VARS;
  
  if (!AIRTABLE_API_KEY) {
    logError('AIRTABLE_API_KEY no está configurado');
    return false;
  }
  logInfo(`AIRTABLE_API_KEY: ${AIRTABLE_API_KEY.substring(0, 10)}... (${AIRTABLE_API_KEY.length} caracteres)`);
  
  if (!AIRTABLE_BASE_ID) {
    logError('AIRTABLE_BASE_ID no está configurado');
    return false;
  }
  logInfo(`AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID}`);
  
  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    
    // Probar acceso a la tabla principal
    logInfo(`Probando acceso a tabla: "${AIRTABLE_TABLE_NAME}"`);
    const records = await base(AIRTABLE_TABLE_NAME).select({ maxRecords: 1 }).firstPage();
    logSuccess(`Acceso a tabla "${AIRTABLE_TABLE_NAME}" exitoso (${records.length} registro encontrado)`);
    
    // Probar acceso a la tabla de logs
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
  
  if (!OPENAI_API_KEY) {
    logError('OPENAI_API_KEY no está configurado');
    return false;
  }
  
  logInfo(`OPENAI_API_KEY: ${OPENAI_API_KEY.substring(0, 10)}... (${OPENAI_API_KEY.length} caracteres)`);
  
  try {
    // Probar con una petición simple a la API de OpenAI
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
  
  // Verificar WP_URL
  if (!WP_URL) {
    logError('WP_URL no está configurado');
    return false;
  }
  logInfo(`WP_URL: ${WP_URL}`);
  
  // Verificar WP_JWT
  if (!WP_JWT) {
    logWarning('WP_JWT no está configurado (se generará automáticamente)');
  } else {
    logInfo(`WP_JWT: ${WP_JWT.substring(0, 30)}... (${WP_JWT.length} caracteres)`);
    
    // Probar el token actual
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
      } else {
        logWarning(`Error al verificar WP_JWT: ${error.message}`);
      }
    }
  }
  
  // Verificar credenciales para renovación
  if (!WP_USERNAME || !WP_PASSWORD) {
    logError('WP_USERNAME o WP_PASSWORD no están configurados');
    logWarning('La renovación automática de JWT NO funcionará');
    return false;
  }
  
  logInfo(`WP_USERNAME: "${WP_USERNAME}" (${WP_USERNAME.length} caracteres)`);
  logInfo(`WP_PASSWORD: "${'*'.repeat(Math.min(WP_PASSWORD.length, 20))}" (${WP_PASSWORD.length} caracteres)`);
  
  // Verificar espacios
  if (WP_USERNAME !== WP_USERNAME.trim()) {
    logWarning(`WP_USERNAME tiene espacios: "${WP_USERNAME}" → "${WP_USERNAME.trim()}"`);
  }
  if (WP_PASSWORD !== WP_PASSWORD.trim()) {
    logWarning(`WP_PASSWORD tiene espacios`);
  }
  
  // Probar generación de token
  try {
    logInfo('Probando generación de nuevo token JWT...');
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
      logInfo(`Username: ${response.data.user_nicename || 'N/A'}`);
      return true;
    } else {
      logError('La respuesta no contiene un token');
      return false;
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    logError(`Error al generar token: ${message}`);
    logError(`Status: ${status || 'N/A'}`);
    
    if (status === 403) {
      logError('\n💡 PROBLEMA DETECTADO: Credenciales incorrectas');
      logError(`   WP_USERNAME actual: "${WP_USERNAME}"`);
      logError('   Verifica que el username sea EXACTO en WordPress');
      logError('   Puede ser que falte o sobre una letra');
    } else if (status === 404) {
      logError('El plugin JWT no está instalado o activo');
    }
    
    return false;
  }
}

async function testResend() {
  logSection('4. VERIFICANDO RESEND (EMAIL)');
  
  const { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO_TEMPLATES } = ENV_VARS;
  
  if (!RESEND_API_KEY) {
    logWarning('RESEND_API_KEY no está configurado (opcional)');
    return null; // No es crítico
  }
  
  logInfo(`RESEND_API_KEY: ${RESEND_API_KEY.substring(0, 10)}...`);
  
  if (!EMAIL_FROM) {
    logWarning('EMAIL_FROM no está configurado');
  } else {
    logInfo(`EMAIL_FROM: ${EMAIL_FROM}`);
  }
  
  if (!EMAIL_TO_TEMPLATES) {
    logWarning('EMAIL_TO_TEMPLATES no está configurado');
  } else {
    logInfo(`EMAIL_TO_TEMPLATES: ${EMAIL_TO_TEMPLATES}`);
  }
  
  try {
    const response = await axios.get('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      timeout: 10000
    });
    
    logSuccess(`Resend API Key válido (${response.data.data?.length || 0} dominios)`);
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      logError('Resend API Key inválido');
    } else {
      logWarning(`No se pudo verificar Resend: ${error.message}`);
    }
    return false;
  }
}

async function testAPIToken() {
  logSection('5. VERIFICANDO API TOKEN');
  
  const { API_TOKEN } = ENV_VARS;
  
  if (!API_TOKEN) {
    logError('API_TOKEN no está configurado');
    return false;
  }
  
  logInfo(`API_TOKEN: ${API_TOKEN.substring(0, 20)}... (${API_TOKEN.length} caracteres)`);
  logSuccess('API_TOKEN configurado (se usa para autenticación de endpoints)');
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
    resend: null, // Opcional
    apiToken: false
  };
  
  try {
    results.airtable = await testAirtable();
    results.openai = await testOpenAI();
    results.wordpress = await testWordPress();
    results.resend = await testResend();
    results.apiToken = await testAPIToken();
  } catch (error) {
    logError(`Error fatal durante las pruebas: ${error.message}`);
  }
  
  // Resumen final
  logSection('RESUMEN DE VERIFICACIÓN');
  
  const critical = [
    { name: 'Airtable', result: results.airtable },
    { name: 'OpenAI', result: results.openai },
    { name: 'WordPress', result: results.wordpress },
    { name: 'API Token', result: results.apiToken }
  ];
  
  const optional = [
    { name: 'Resend', result: results.resend }
  ];
  
  console.log('\n📊 RESULTADOS CRÍTICOS:');
  critical.forEach(({ name, result }) => {
    if (result) {
      logSuccess(`${name}: OK`);
    } else {
      logError(`${name}: FALLO`);
    }
  });
  
  console.log('\n📊 RESULTADOS OPCIONALES:');
  optional.forEach(({ name, result }) => {
    if (result === null) {
      logWarning(`${name}: No configurado (opcional)`);
    } else if (result) {
      logSuccess(`${name}: OK`);
    } else {
      logError(`${name}: FALLO`);
    }
  });
  
  const allCriticalPass = critical.every(c => c.result);
  
  console.log('\n' + '='.repeat(60));
  if (allCriticalPass) {
    log('✅ TODAS LAS VERIFICACIONES CRÍTICAS PASARON', 'green');
    log('   Tu configuración está lista para producción', 'green');
  } else {
    log('❌ ALGUNAS VERIFICACIONES CRÍTICAS FALLARON', 'red');
    log('   Revisa los errores arriba y corrige las variables en Vercel', 'red');
  }
  console.log('='.repeat(60) + '\n');
  
  // Detalles específicos de WordPress si falló
  if (!results.wordpress) {
    console.log('\n🔧 ACCIÓN REQUERIDA PARA WORDPRESS:');
    console.log('   1. Verifica WP_USERNAME en Vercel');
    console.log('   2. Asegúrate de que sea EXACTAMENTE el username de WordPress');
    console.log('   3. Verifica WP_PASSWORD (debe ser correcto o Application Password)');
    console.log('   4. Haz redeploy después de actualizar las variables\n');
  }
  
  process.exit(allCriticalPass ? 0 : 1);
}

// Ejecutar todas las pruebas
runAllTests().catch(err => {
  logError(`Error fatal: ${err.message}`);
  process.exit(1);
});










