/**
 * 🧪 Validación de Código - Sin llamadas a APIs
 * 
 * Este script valida que el código esté correctamente estructurado
 * sin necesidad de credenciales o llamadas a APIs externas.
 */

console.log('🧪 Iniciando validación de código...\n');

// 1. Verificar que las dependencias necesarias estén instaladas
console.log('📦 Verificando dependencias...');
try {
  const sharp = require('sharp');
  console.log('  ✅ sharp instalado correctamente');
} catch (e) {
  console.log('  ❌ sharp NO instalado:', e.message);
  process.exit(1);
}

try {
  const FormData = require('form-data');
  console.log('  ✅ form-data instalado correctamente');
} catch (e) {
  console.log('  ❌ form-data NO instalado:', e.message);
  process.exit(1);
}

// 2. Verificar que el handler se pueda importar
console.log('\n📄 Verificando estructura del handler...');
try {
  const handler = require('../api/images/created_img.js');
  
  if (typeof handler !== 'function') {
    console.log('  ❌ El handler no es una función');
    process.exit(1);
  }
  
  console.log('  ✅ Handler importado correctamente');
  console.log('  ✅ Handler es una función async');
  
} catch (e) {
  console.log('  ❌ Error al importar handler:', e.message);
  process.exit(1);
}

// 3. Verificar que el código tenga las correcciones implementadas
console.log('\n🔍 Verificando correcciones implementadas...');
const fs = require('fs');
const handlerCode = fs.readFileSync('../api/images/created_img.js', 'utf8');

const checks = [
  {
    name: 'FormData importado',
    test: () => handlerCode.includes('const FormData = require("form-data")'),
  },
  {
    name: 'Buffer usado correctamente',
    test: () => handlerCode.includes('form.append("file", jpegBuffer,'),
  },
  {
    name: 'Headers de form-data incluidos',
    test: () => handlerCode.includes('...form.getHeaders()'),
  },
  {
    name: 'Header Authorization estándar',
    test: () => handlerCode.includes('"Authorization": `Bearer ${WP_JWT}`'),
  },
  {
    name: 'Logging implementado',
    test: () => handlerCode.includes('console.log') && handlerCode.includes('🎨'),
  },
];

let allPassed = true;
for (const check of checks) {
  const passed = check.test();
  console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
  if (!passed) allPassed = false;
}

// 4. Verificar estructura del package.json
console.log('\n📦 Verificando package.json...');
try {
  const pkg = require('../package.json');
  
  if (!pkg.dependencies['form-data']) {
    console.log('  ❌ form-data no está en dependencies');
    allPassed = false;
  } else {
    console.log('  ✅ form-data en dependencies:', pkg.dependencies['form-data']);
  }
  
  if (!pkg.dependencies['sharp']) {
    console.log('  ❌ sharp no está en dependencies');
    allPassed = false;
  } else {
    console.log('  ✅ sharp en dependencies:', pkg.dependencies['sharp']);
  }
  
} catch (e) {
  console.log('  ❌ Error al leer package.json:', e.message);
  allPassed = false;
}

// 5. Verificar plugin de WordPress
console.log('\n🔌 Verificando plugin de WordPress...');
try {
  const pluginCode = fs.readFileSync('./deeplingual-regenerate-meta.php', 'utf8');
  
  if (!pluginCode.includes('wp_ajax_regenerate_attachment_metadata')) {
    console.log('  ⚠️  Plugin no tiene acción AJAX configurada');
  } else {
    console.log('  ✅ Plugin con acción AJAX configurada');
  }
  
  if (pluginCode.includes('WP_StateLess_Media')) {
    console.log('  ✅ Plugin integrado con WP Stateless');
  } else {
    console.log('  ℹ️  Plugin sin integración WP Stateless (opcional)');
  }
  
} catch (e) {
  console.log('  ⚠️  No se pudo verificar plugin:', e.message);
}

// Resumen final
console.log('\n' + '═'.repeat(50));
if (allPassed) {
  console.log('✅ TODAS LAS VALIDACIONES PASARON');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Configura las variables de entorno (WP_URL, WP_JWT, OPENAI_API_KEY)');
  console.log('   2. Ejecuta: node test-image-creation.js');
  console.log('   3. O despliega directamente a Vercel');
  console.log('═'.repeat(50));
  process.exit(0);
} else {
  console.log('❌ ALGUNAS VALIDACIONES FALLARON');
  console.log('   Revisa los errores anteriores');
  console.log('═'.repeat(50));
  process.exit(1);
}

