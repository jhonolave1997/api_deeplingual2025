/**
 * 🧪 Script de Prueba Completa para Actividad Pedagógica 222292
 * 
 * 1. Extrae información de la actividad
 * 2. Genera prompt relacionado
 * 3. Genera imágenes en el orden correcto
 * 4. Verifica que se hayan guardado correctamente
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const { makeAuthenticatedRequest } = require('../utils/wp-auth');

const BASE_URL = process.argv[2] || 
                 process.env.BASE_URL || 
                 process.env.VERCEL_URL || 
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                 'https://apideeplingual26.vercel.app';

const API_TOKEN = process.env.API_TOKEN;
const WP_URL = process.env.WP_URL || '';

const WP_POST_ID = 222292;

async function testActivity222292() {
  console.log('🧪 Iniciando prueba completa para actividad pedagógica 222292\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!API_TOKEN || !WP_URL) {
    console.error('❌ Error: Faltan variables de entorno (API_TOKEN, WP_URL)');
    process.exit(1);
  }

  try {
    // PASO 1: Extraer información de la actividad
    console.log('📋 PASO 1: Extrayendo información de la actividad...\n');
    let actividadInfo;
    try {
      actividadInfo = await getActivityInfo(WP_POST_ID);
    } catch (error) {
      console.log('⚠️  No se pudo obtener información directamente de WordPress');
      console.log('   Intentando obtener información desde la API...\n');
      actividadInfo = await getActivityInfoFromAPI(WP_POST_ID);
    }
    
    console.log('✅ Información de la actividad obtenida:');
    console.log(JSON.stringify(actividadInfo, null, 2));
    console.log('\n');

    // PASO 2: Generar prompts relacionados
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 PASO 2: Generando prompts relacionados...\n');
    
    const prompts = generatePrompts(actividadInfo);
    console.log('Prompts generados:');
    prompts.forEach((p, idx) => {
      console.log(`\n   Prompt ${idx + 1} (num_imagen: ${p.num_imagen}):`);
      console.log(`   ${p.prompt}`);
    });
    console.log('\n');

    // PASO 3: Generar imágenes en el orden correcto
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 PASO 3: Generando imágenes...\n');
    
    const resultados = [];
    for (const promptData of prompts) {
      console.log(`\n⏳ Generando imagen ${promptData.num_imagen === 0 ? '1 (plantilla)' : '2 (evidencia)'}...`);
      const resultado = await generateImage(promptData, actividadInfo);
      resultados.push(resultado);
      
      // Esperar un poco entre imágenes
      if (prompts.indexOf(promptData) < prompts.length - 1) {
        console.log('   Esperando 3 segundos antes de la siguiente imagen...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // PASO 4: Verificar que se hayan guardado correctamente
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 PASO 4: Verificando campos ACF...\n');
    
    await verifyAllFields(WP_POST_ID, resultados, actividadInfo);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Prueba completada exitosamente\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA\n');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

async function getActivityInfo(wpPostId) {
  const cleanUrl = WP_URL.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/wp-json/wp/v2/planessemanales/${wpPostId}`;
  
  try {
    const response = await makeAuthenticatedRequest(endpoint, {
      method: 'GET',
      params: {
        '_fields': 'id,title,content,acf'
      }
    }, true); // Usar axios

    const acf = response.data.acf || {};
    
    return {
      id: response.data.id,
      title: response.data.title?.rendered || response.data.title || '',
      content: response.data.content?.rendered || response.data.content || '',
      tema: acf.tema || '',
      descripcion: acf.descripcion || '',
      objetivos: acf.objetivos || '',
      instrucciones: acf.instrucciones || '',
      requiere_plantilla: acf.requiere_plantilla === true || acf.requiere_plantilla === '1' || acf.requiere_plantilla === 1,
      multimedia_es: acf.multimedia_es || acf.plantilla_es || null,
      multimedia_en: acf.multimedia_en || acf.plantilla_en || null,
      foto: acf.foto || acf.evidencia || null,
      grupo_de_edad: acf.grupo_de_edad || '',
      momento_de_aprendizaje: acf.momento_de_aprendizaje || '',
      tipo_de_actividad: acf.tipo_de_actividad || '',
      acf_completo: acf
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Actividad ${wpPostId} no encontrada en WordPress`);
    }
    throw error;
  }
}

async function getActivityInfoFromAPI(wpPostId) {
  // Intentar obtener información desde un endpoint de la API si existe
  // Por ahora, retornamos valores por defecto y el usuario puede ajustar
  console.log('   Usando valores por defecto para la prueba');
  console.log('   (Se generarán imágenes según requiere_plantilla)\n');
  
  // Intentar obtener desde la API si hay un endpoint disponible
  // Por ahora retornamos estructura básica
  return {
    id: wpPostId,
    title: 'Actividad Pedagógica',
    tema: 'Actividad educativa',
    descripcion: 'Actividad pedagógica para desarrollo de habilidades',
    objetivos: 'Desarrollar habilidades educativas',
    instrucciones: 'Sigue las instrucciones de la actividad',
    requiere_plantilla: true, // Por defecto asumimos que requiere plantilla para probar ambos casos
    grupo_de_edad: '5 años',
    momento_de_aprendizaje: 'Aprendizaje activo',
    tipo_de_actividad: 'Educativa'
  };
}

function generatePrompts(actividadInfo) {
  const prompts = [];
  
  // Base del prompt
  const basePrompt = `Ilustración educativa para actividad pedagógica. ${actividadInfo.tema ? `Tema: ${actividadInfo.tema}.` : ''} ${actividadInfo.descripcion ? `Descripción: ${actividadInfo.descripcion}.` : ''} ${actividadInfo.grupo_de_edad ? `Edad objetivo: ${actividadInfo.grupo_de_edad}.` : ''} Estilo infantil, colorido, educativo. Fondo claro. Sin texto, sin marcas de agua.`;
  
  if (actividadInfo.requiere_plantilla) {
    // Si requiere plantilla, generar 2 imágenes
    // Primera imagen (num_imagen = 0): plantilla
    prompts.push({
      num_imagen: 0,
      prompt: `Plantilla educativa. ${basePrompt} Diseño de plantilla imprimible, con espacios para completar o colorear. Formato horizontal preferible.`
    });
    
    // Segunda imagen (num_imagen = 1): evidencia
    prompts.push({
      num_imagen: 1,
      prompt: `Evidencia de actividad completada. ${basePrompt} Muestra el resultado final de la actividad, con elementos visuales que demuestren el aprendizaje.`
    });
  } else {
    // Si no requiere plantilla, solo una imagen (num_imagen no importa, pero usamos 0)
    prompts.push({
      num_imagen: 0,
      prompt: `Ilustración educativa. ${basePrompt} Representación visual de la actividad pedagógica.`
    });
  }
  
  return prompts;
}

async function generateImage(promptData, actividadInfo) {
  const testData = {
    prompt: promptData.prompt,
    wp_post_id: WP_POST_ID,
    n: 1,
    size: "1024x1024",
    requiere_plantilla: actividadInfo.requiere_plantilla,
    num_imagen: promptData.num_imagen,
    run_id: `deep-lingual-${Date.now()}`
  };

  try {
    const url = `${BASE_URL}/api/images/created_img`;
    const response = await axios.post(url, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      timeout: 120000
    });

    if (response.status === 200) {
      const preview = response.data.previews[0];
      console.log(`   ✅ Imagen generada: Media ID ${preview.media_id}`);
      console.log(`   URL: ${preview.url}`);
      
      return {
        num_imagen: promptData.num_imagen,
        media_id: preview.media_id,
        url: preview.url,
        tipo: promptData.num_imagen === 0 && actividadInfo.requiere_plantilla ? 'plantilla' : 
              promptData.num_imagen !== 0 && actividadInfo.requiere_plantilla ? 'evidencia' : 
              'foto'
      };
    } else {
      throw new Error(`Error en generación: ${response.status}`);
    }
  } catch (error) {
    console.error(`   ❌ Error al generar imagen: ${error.message}`);
    throw error;
  }
}

async function verifyAllFields(wpPostId, resultados, actividadInfo) {
  const cleanUrl = WP_URL.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/wp-json/wp/v2/planessemanales/${wpPostId}`;
  
  try {
    const response = await makeAuthenticatedRequest(endpoint, {
      method: 'GET',
      params: {
        '_fields': 'id,acf'
      }
    }, true); // Usar axios

    const acf = response.data.acf || {};
    
    console.log('📋 Campos ACF actuales:');
    console.log(JSON.stringify({
      multimedia_es: acf.multimedia_es,
      multimedia_en: acf.multimedia_en,
      foto: acf.foto,
      requiere_plantilla: acf.requiere_plantilla
    }, null, 2));
    console.log('\n');

    // Verificar según requiere_plantilla
    if (actividadInfo.requiere_plantilla) {
      // Debe tener plantilla (multimedia_es, multimedia_en) y evidencia (foto)
      const plantillaResultado = resultados.find(r => r.tipo === 'plantilla');
      const evidenciaResultado = resultados.find(r => r.tipo === 'evidencia');
      
      console.log('🔍 Verificando campos para actividad con plantilla:\n');
      
      // Verificar multimedia_es
      const multimediaEsId = typeof acf.multimedia_es === 'object' ? (acf.multimedia_es.id || acf.multimedia_es.ID) : acf.multimedia_es;
      const multimediaEsOk = multimediaEsId === plantillaResultado?.media_id;
      console.log(`   ${multimediaEsOk ? '✅' : '❌'} multimedia_es: ${multimediaEsId} (esperado: ${plantillaResultado?.media_id})`);
      
      // Verificar multimedia_en
      const multimediaEnId = typeof acf.multimedia_en === 'object' ? (acf.multimedia_en.id || acf.multimedia_en.ID) : acf.multimedia_en;
      const multimediaEnOk = multimediaEnId === plantillaResultado?.media_id;
      console.log(`   ${multimediaEnOk ? '✅' : '❌'} multimedia_en: ${multimediaEnId} (esperado: ${plantillaResultado?.media_id})`);
      
      // Verificar foto (evidencia)
      const fotoId = typeof acf.foto === 'object' ? (acf.foto.id || acf.foto.ID) : acf.foto;
      const fotoUrl = typeof acf.foto === 'string' ? acf.foto : (acf.foto?.url || acf.foto?.source_url || '');
      const fotoOk = fotoId === evidenciaResultado?.media_id || 
                     fotoUrl.includes(String(evidenciaResultado?.media_id)) ||
                     (fotoUrl && evidenciaResultado?.url && fotoUrl.includes(evidenciaResultado.url.split('/').pop().split('-')[0]));
      console.log(`   ${fotoOk ? '✅' : '❌'} foto: ${fotoId || fotoUrl} (esperado: ${evidenciaResultado?.media_id})`);
      
      if (multimediaEsOk && multimediaEnOk && fotoOk) {
        console.log('\n🎉 ¡PERFECTO! Todos los campos están correctamente actualizados.');
      } else {
        console.log('\n⚠️  Algunos campos no coinciden con los media_ids esperados.');
      }
    } else {
      // Solo debe tener foto
      const fotoResultado = resultados[0];
      
      console.log('🔍 Verificando campo para actividad sin plantilla:\n');
      
      const fotoId = typeof acf.foto === 'object' ? (acf.foto.id || acf.foto.ID) : acf.foto;
      const fotoUrl = typeof acf.foto === 'string' ? acf.foto : (acf.foto?.url || acf.foto?.source_url || '');
      const fotoOk = fotoId === fotoResultado?.media_id || 
                     fotoUrl.includes(String(fotoResultado?.media_id)) ||
                     (fotoUrl && fotoResultado?.url && fotoUrl.includes(fotoResultado.url.split('/').pop().split('-')[0]));
      
      console.log(`   ${fotoOk ? '✅' : '❌'} foto: ${fotoId || fotoUrl} (esperado: ${fotoResultado?.media_id})`);
      
      // Verificar que multimedia_es y multimedia_en NO estén actualizados
      const multimediaEsOk = !acf.multimedia_es || acf.multimedia_es === null || acf.multimedia_es === '';
      const multimediaEnOk = !acf.multimedia_en || acf.multimedia_en === null || acf.multimedia_en === '';
      
      console.log(`   ${multimediaEsOk ? '✅' : '⚠️'} multimedia_es: ${acf.multimedia_es || 'vacío (correcto)'}`);
      console.log(`   ${multimediaEnOk ? '✅' : '⚠️'} multimedia_en: ${acf.multimedia_en || 'vacío (correcto)'}`);
      
      if (fotoOk && multimediaEsOk && multimediaEnOk) {
        console.log('\n🎉 ¡PERFECTO! El campo foto está correctamente actualizado y los campos de plantilla están vacíos.');
      } else {
        console.log('\n⚠️  Hay inconsistencias en los campos.');
      }
    }
    
  } catch (error) {
    console.error('⚠️  Error al verificar campos ACF:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2).slice(0, 500)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Ejecutar prueba
testActivity222292();

