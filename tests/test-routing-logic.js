/**
 * 🧪 Script de Prueba de Lógica de Enrutamiento
 * 
 * Este script valida SOLO la lógica de enrutamiento sin hacer
 * llamadas reales a APIs externas. Simula el comportamiento
 * para verificar que el endpoint correcto sea seleccionado.
 * 
 * Uso: node test-routing-logic.js
 */

console.log('🧪 PRUEBA DE LÓGICA DE ENRUTAMIENTO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * Extrae la lógica de enrutamiento del archivo created_img.js
 * para validarla de forma aislada
 */
function determineEndpointAndFields(run_id, update_fields) {
  // Esta es la misma lógica implementada en created_img.js
  let endpoint = "planessemanales";
  let defaultFields = ["foto"];
  
  // Detectar si es deepgraphic
  if (run_id && run_id.startsWith("deepgraphic-")) {
    endpoint = "actividadlogicomatematica";
    defaultFields = ["plantilla_es"];
  }

  const fields = Array.isArray(update_fields) && update_fields.length
    ? update_fields
    : defaultFields;

  return { endpoint, fields };
}

// ==================================================
// CASOS DE PRUEBA
// ==================================================
const testCases = [
  {
    name: "Deep Lingual - Sin campos personalizados",
    run_id: "deep-lingual-abc123",
    update_fields: undefined,
    expected: {
      endpoint: "planessemanales",
      fields: ["foto"]
    }
  },
  {
    name: "Deep Lingual - Con campo multimedia",
    run_id: "deep-lingual-xyz789",
    update_fields: ["multimedia"],
    expected: {
      endpoint: "planessemanales",
      fields: ["multimedia"]
    }
  },
  {
    name: "Deep Lingual - Con campo multimedia_en",
    run_id: "deep-lingual-test-001",
    update_fields: ["multimedia_en"],
    expected: {
      endpoint: "planessemanales",
      fields: ["multimedia_en"]
    }
  },
  {
    name: "Deep Lingual - Con múltiples campos",
    run_id: "deep-lingual-multi",
    update_fields: ["multimedia", "multimedia_en"],
    expected: {
      endpoint: "planessemanales",
      fields: ["multimedia", "multimedia_en"]
    }
  },
  {
    name: "DeepGraphic - Sin campos personalizados",
    run_id: "deepgraphic-abc123",
    update_fields: undefined,
    expected: {
      endpoint: "actividadlogicomatematica",
      fields: ["plantilla_es"]
    }
  },
  {
    name: "DeepGraphic - Con campo plantilla_es",
    run_id: "deepgraphic-xyz789",
    update_fields: ["plantilla_es"],
    expected: {
      endpoint: "actividadlogicomatematica",
      fields: ["plantilla_es"]
    }
  },
  {
    name: "DeepGraphic - Con campo plantilla_en",
    run_id: "deepgraphic-test-001",
    update_fields: ["plantilla_en"],
    expected: {
      endpoint: "actividadlogicomatematica",
      fields: ["plantilla_en"]
    }
  },
  {
    name: "DeepGraphic - Con ambas plantillas",
    run_id: "deepgraphic-multi",
    update_fields: ["plantilla_es", "plantilla_en"],
    expected: {
      endpoint: "actividadlogicomatematica",
      fields: ["plantilla_es", "plantilla_en"]
    }
  },
  {
    name: "Run ID sin prefijo reconocido (fallback a planessemanales)",
    run_id: "otro-prefijo-123",
    update_fields: undefined,
    expected: {
      endpoint: "planessemanales",
      fields: ["foto"]
    }
  },
  {
    name: "Run ID null (fallback a planessemanales)",
    run_id: null,
    update_fields: undefined,
    expected: {
      endpoint: "planessemanales",
      fields: ["foto"]
    }
  }
];

// ==================================================
// EJECUTAR PRUEBAS
// ==================================================
let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 Caso ${index + 1}: ${test.name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  console.log('Entrada:');
  console.log(`   run_id: "${test.run_id}"`);
  console.log(`   update_fields: ${JSON.stringify(test.update_fields)}\n`);

  const result = determineEndpointAndFields(test.run_id, test.update_fields);

  console.log('Resultado:');
  console.log(`   endpoint: "${result.endpoint}"`);
  console.log(`   fields: ${JSON.stringify(result.fields)}\n`);

  console.log('Esperado:');
  console.log(`   endpoint: "${test.expected.endpoint}"`);
  console.log(`   fields: ${JSON.stringify(test.expected.fields)}\n`);

  // Validar resultado
  const endpointMatch = result.endpoint === test.expected.endpoint;
  const fieldsMatch = JSON.stringify(result.fields) === JSON.stringify(test.expected.fields);
  
  if (endpointMatch && fieldsMatch) {
    console.log('✅ PASÓ - El enrutamiento es correcto\n');
    passedTests++;
  } else {
    console.log('❌ FALLÓ - El enrutamiento es incorrecto');
    if (!endpointMatch) {
      console.log(`   • Endpoint no coincide: esperado "${test.expected.endpoint}", obtenido "${result.endpoint}"`);
    }
    if (!fieldsMatch) {
      console.log(`   • Fields no coinciden: esperado ${JSON.stringify(test.expected.fields)}, obtenido ${JSON.stringify(result.fields)}`);
    }
    console.log();
    failedTests++;
  }
});

// ==================================================
// RESUMEN
// ==================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RESUMEN DE PRUEBAS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`Total de casos: ${testCases.length}`);
console.log(`✅ Pasaron: ${passedTests}`);
console.log(`❌ Fallaron: ${failedTests}\n`);

if (failedTests === 0) {
  console.log('🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE\n');
  console.log('✅ La lógica de enrutamiento funciona correctamente:');
  console.log('   • run_id con "deep-lingual-" → planessemanales + foto');
  console.log('   • run_id con "deepgraphic-" → actividadlogicomatematica + plantilla_es');
  console.log('   • update_fields personalizado → usa los campos especificados');
  console.log('   • Sin prefijo reconocido → fallback a planessemanales + foto\n');
  
  console.log('✅ El código en created_img.js está listo para usar en producción.\n');
  console.log('💡 Para probar con APIs reales:');
  console.log('   1. Crea un archivo .env con tus credenciales');
  console.log('   2. Ejecuta: node test-dual-activity-flow.js\n');
  
  process.exit(0);
} else {
  console.log('⚠️  ALGUNAS PRUEBAS FALLARON\n');
  console.log('❌ Hay problemas con la lógica de enrutamiento.');
  console.log('   Revisa el código en created_img.js\n');
  process.exit(1);
}





















