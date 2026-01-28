/**
 * Script para probar el envío de correos con Mandrill
 */

require('dotenv').config();
const { sendTemplateRequiredEmail } = require('../utils/email');

const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY?.trim();
const EMAIL_FROM = process.env.EMAIL_FROM?.trim();
const EMAIL_TO_TEMPLATES = process.env.EMAIL_TO_TEMPLATES?.trim();

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

function parseRecipients(v) {
  return String(v || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

async function testEmailSending() {
  console.log('\n' + '='.repeat(60));
  log('VERIFICACIÓN DE ENVÍO DE CORREOS CON MANDRILL', 'cyan');
  console.log('='.repeat(60) + '\n');

  // Verificar variables
  logInfo('Verificando variables de entorno...');
  
  if (!MANDRILL_API_KEY) {
    logError('MANDRILL_API_KEY no está configurado');
    process.exit(1);
  }
  logInfo(`MANDRILL_API_KEY: ${MANDRILL_API_KEY.substring(0, 10)}... (${MANDRILL_API_KEY.length} caracteres)`);

  if (!EMAIL_FROM) {
    logError('EMAIL_FROM no está configurado');
    process.exit(1);
  }
  logInfo(`EMAIL_FROM: ${EMAIL_FROM}`);

  if (!EMAIL_TO_TEMPLATES) {
    logError('EMAIL_TO_TEMPLATES no está configurado');
    process.exit(1);
  }
  logInfo(`EMAIL_TO_TEMPLATES: ${EMAIL_TO_TEMPLATES}`);

  // Parsear destinatarios
  const recipients = parseRecipients(EMAIL_TO_TEMPLATES);
  logInfo(`Destinatarios parseados: ${recipients.length}`);
  recipients.forEach((email, i) => {
    logInfo(`  ${i + 1}. ${email}`);
  });

  if (recipients.length === 0) {
    logError('No se encontraron destinatarios válidos en EMAIL_TO_TEMPLATES');
    process.exit(1);
  }

  // Probar envío usando la función del módulo
  logInfo('\nProbando envío de correo usando sendTemplateRequiredEmail...');
  
  try {
    const result = await sendTemplateRequiredEmail({
      runId: 'test-run-id-' + Date.now(),
      wpPostId: '999',
      title: 'Prueba de Correo con Mandrill',
      airtableRecordId: 'recTest123'
    });

    logSuccess('Correo enviado exitosamente!');
    logInfo(`Resultado: ${JSON.stringify(result, null, 2)}`);
    
    console.log('\n' + '='.repeat(60));
    logSuccess('VERIFICACIÓN EXITOSA');
    console.log('='.repeat(60));
    logInfo('Revisa tu bandeja de entrada (y spam) para confirmar la recepción\n');
    
    return true;
  } catch (error) {
    logError('Error al enviar correo:');
    logError(`Mensaje: ${error.message}`);
    
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.message?.includes('Invalid_Key') || error.message?.includes('401')) {
      logWarning('\n💡 Posible problema: MANDRILL_API_KEY inválido o expirado');
      logWarning('   Verifica tu API Key en: https://mandrillapp.com/settings');
    }
    
    if (error.message?.includes('ValidationError')) {
      logWarning('\n💡 Posible problema: Error de validación');
      logWarning('   Verifica que EMAIL_FROM y EMAIL_TO_TEMPLATES sean correctos');
    }
    
    console.log('\n' + '='.repeat(60));
    logError('VERIFICACIÓN FALLIDA');
    console.log('='.repeat(60) + '\n');
    
    return false;
  }
}

async function runTest() {
  const success = await testEmailSending();
  process.exit(success ? 0 : 1);
}

runTest().catch(err => {
  logError(`Error fatal: ${err.message}`);
  process.exit(1);
});
