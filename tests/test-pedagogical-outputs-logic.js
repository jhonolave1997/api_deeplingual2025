const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_TOKEN = process.env.API_TOKEN;
// Usar URL de producción si está disponible, sino localhost
// Puedes pasar la URL como argumento: node test-pedagogical-outputs-logic.js https://tu-api.vercel.app
const BASE_URL = process.argv[2] || 
                 process.env.BASE_URL || 
                 process.env.VERCEL_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                 'https://apideeplingual26.vercel.app';

// Nueva estructura: campos ACF directamente en output_json
const testData = {
  "run_id": "deepgraphic-20260126-1600",
  "needs_clarification": false,
  "output_json": {
    "title": "Matriz Geométrica Multivariable",
    "status": "publish",
    "content": "Actividad lógico-matemática de alta complejidad basada en matrices visuales con figuras geométricas compuestas.",
    "tema": "Patrones geométricos complejos",
    "descripcion": "Los estudiantes analizan una matriz de figuras geométricas complejas donde cambian simultáneamente forma, orientación, cantidad de lados, color interno y patrón de sombreado para identificar la figura faltante.",
    "objetivos": "Desarrollar el razonamiento lógico-matemático avanzado, la detección de patrones múltiples y la resolución de problemas abstractos.",
    "instrucciones": "Observa cuidadosamente la matriz de figuras. Analiza cómo cambian las formas en filas y columnas y selecciona la opción que completa correctamente el patrón.",
    "framework": "NNAT2 / OLSAT",
    "tipo_razonamiento": "actividades",
    "competencia_cognitiva": "Razonamiento abstracto y pensamiento matemático",
    "nivel_dificultad": 5,
    "grupo_de_edad": "9 años",
    "estimulo": [],
    "pasos": "1. Observa cada fila de la matriz.\n2. Identifica los cambios en forma, rotación y color.\n3. Analiza la relación entre filas y columnas.\n4. Elige la opción que completa la matriz.",
    "tips": "Invita al estudiante a verbalizar cada patrón identificado antes de responder.",
    "criteria": "Selecciona la figura que cumple simultáneamente todos los patrones lógicos presentes.",
    "promt_visual": "Ilustración plana, fondo claro. Matriz 3x3 de figuras geométricas complejas. Cada figura es un polígono compuesto (hexágono con triángulo interno). Variaciones sistemáticas: rotación de 45 grados por columna, aumento progresivo de lados del polígono interno por fila, colores azul, rojo y verde alternados. Una celda vacía. Sin texto, sin bordes, sin marcas de agua.",
    "dia_especifico": " ",
    "respuesta_correcta": "Opción C: Hexágono verde con triángulo interno de 5 lados rotado 90 grados.",
    "opciones_respuesta": "A. Hexágono azul con triángulo de 4 lados\nB. Pentágono verde con triángulo de 5 lados\nC. Hexágono verde con triángulo de 5 lados rotado\nD. Hexágono rojo con triángulo de 6 lados",
    "requiere_plantilla": true,
    "momento_de_aprendizaje": "Lógica y memoria",
    "elof": ["3.3 Cognición - Razonamiento y Resolucion de problemas", "3.4 Cognición - Pensamiento matemático emergente"],
    "dominios_uc": ["3.3 Tecnología - Patrones y matrices", "5.2 Resolución de Problemas - Incorpora soluciones ante el problema"],
    "enfoque_general": ["Tradicional"],
    "enfoque_pedagojico": ["Tradicional"],
    "curriculum": ["Intermedio"],
    "mes": "enero",
    "language": "es",
    "tiempo_en_minutos": 20,
    "observaciones": "Actividad recomendada para evaluación cognitiva avanzada."
  }
};

async function testPedagogicalOutputsLogic() {
  console.log('🧪 Iniciando prueba de actividades lógicas...\n');
  
  if (!API_TOKEN) {
    console.error('❌ Error: API_TOKEN no está configurado');
    console.error('   Configura API_TOKEN en tu archivo .env o como variable de entorno\n');
    process.exit(1);
  }

  console.log('📋 Datos a enviar:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    const url = `${BASE_URL}/api/pedagogical-outputs-logic`;
    console.log(`🌐 URL: ${url}`);
    console.log(`🔑 Token: ${API_TOKEN ? '✅ Presente' : '❌ FALTANTE'}\n`);

    const response = await axios.post(url, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    const responseData = response.data;
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Éxito! Respuesta:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.airtable?.success) {
        console.log(`\n📝 Airtable Record ID: ${responseData.airtable?.record?.id}`);
      }
      
      if (responseData.wordpress?.success) {
        console.log(`📝 WordPress Post ID: ${responseData.wp_post_id || responseData.wordpress?.wp_post_id || responseData.wordpress?.post?.id}`);
      }
    } else {
      console.error('❌ Error en la respuesta:');
      console.error(JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error en la petición:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error(error.message);
    } else {
      console.error(error.message);
    }
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testPedagogicalOutputsLogic();

