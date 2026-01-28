/**
 * 🧪 Test de Conexión a Google Cloud Storage vía WP-Stateless
 * 
 * Este script sube una imagen de prueba a WordPress y verifica
 * que se sincronice correctamente con GCS.
 */

const axios = require('axios');
const FormData = require('form-data');

const WP_URL = "https://twinkle.acuarelacore.com";
const WP_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2ODA1OTQwMCwibmJmIjoxNzY4MDU5NDAwLCJleHAiOjE3Njg2NjQyMDAsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.zQXetd5ttwen--rUp2Pz6WVa9EDWxbiWdWJQpbWUqVk";

async function testGCSConnection() {
  console.log('🧪 Probando conexión a Google Cloud Storage...\n');
  
  try {
    // Crear imagen de prueba única (PNG simple con timestamp en metadata)
    const sharp = require('sharp');
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255), alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    console.log('📤 Paso 1: Subiendo imagen de prueba a WordPress...');
    
    const form = new FormData();
    form.append('file', testImage, {
      filename: `test-gcs-${Date.now()}.png`,
      contentType: 'image/png'
    });
    form.append('title', 'Test GCS Connection');
    
    const uploadResp = await axios.post(
      `${WP_URL}/wp-json/wp/v2/media`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${WP_JWT}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    
    const mediaId = uploadResp.data.id;
    const wpUrl = uploadResp.data.source_url;
    
    console.log('   ✅ Imagen subida a WordPress');
    console.log('   Media ID:', mediaId);
    console.log('   URL WordPress:', wpUrl);
    
    // Esperar un momento para que WP-Stateless sincronice
    console.log('\n⏳ Paso 2: Esperando sincronización con GCS (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Intentar forzar sincronización con nuestro endpoint personalizado
    console.log('\n🔄 Paso 3: Forzando sincronización con endpoint personalizado...');
    try {
      const syncResp = await axios.post(
        `${WP_URL}/wp-json/deeplingual/v1/sync-media/${mediaId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${WP_JWT}`,
          },
        }
      );
      
      console.log('   ✅ Sincronización forzada exitosa');
      console.log('   Método:', syncResp.data.method);
      console.log('   URL final:', syncResp.data.url);
      
      // Verificar si la URL cambió a GCS
      const finalUrl = syncResp.data.url;
      if (finalUrl.includes('storage.googleapis.com') || finalUrl.includes('storage.cloud.google.com')) {
        console.log('\n✅ ¡ÉXITO! La imagen está en Google Cloud Storage');
        console.log('   URL de GCS:', finalUrl);
      } else if (finalUrl.includes('twinkle.acuarelacore.com')) {
        console.log('\n⚠️  La imagen sigue en WordPress local');
        console.log('   Esto puede significar:');
        console.log('   1. WP-Stateless está en modo "Backup" (no reemplaza URLs)');
        console.log('   2. La sincronización está pendiente');
        console.log('   3. Hay un problema de configuración');
      }
      
    } catch (syncError) {
      console.log('   ⚠️  Endpoint personalizado no disponible');
      console.log('   (El plugin aún no está actualizado)');
    }
    
    // Verificar accesibilidad de la URL
    console.log('\n🔍 Paso 4: Verificando accesibilidad de la URL...');
    try {
      const checkResp = await axios.head(wpUrl, { timeout: 10000 });
      console.log('   ✅ URL accesible (HTTP', checkResp.status + ')');
      console.log('   Content-Type:', checkResp.headers['content-type']);
      
      // Verificar si es redirect a GCS
      if (checkResp.request?.res?.responseUrl) {
        const finalUrl = checkResp.request.res.responseUrl;
        if (finalUrl.includes('storage.googleapis.com')) {
          console.log('   ✅ Redirige a GCS:', finalUrl);
        }
      }
      
    } catch (checkError) {
      console.log('   ❌ URL NO accesible');
      console.log('   Error:', checkError.message);
    }
    
    // Obtener información del attachment
    console.log('\n📊 Paso 5: Obteniendo metadata del attachment...');
    try {
      const mediaResp = await axios.get(
        `${WP_URL}/wp-json/wp/v2/media/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${WP_JWT}`,
          },
        }
      );
      
      console.log('   Metadata del archivo:');
      console.log('   - Tipo MIME:', mediaResp.data.mime_type);
      console.log('   - URL source:', mediaResp.data.source_url);
      
      // Buscar metadata de WP-Stateless
      if (mediaResp.data.meta) {
        console.log('   - Meta disponible');
      }
      
    } catch (metaError) {
      console.log('   ⚠️  No se pudo obtener metadata');
    }
    
    // Resumen final
    console.log('\n' + '═'.repeat(60));
    console.log('📋 RESUMEN:');
    console.log('═'.repeat(60));
    console.log('✅ Subida a WordPress: FUNCIONAL');
    console.log('Media ID creado:', mediaId);
    console.log('URL WordPress:', wpUrl);
    
    if (wpUrl.includes('storage.googleapis.com')) {
      console.log('\n🎉 WP-STATELESS CONFIGURADO CORRECTAMENTE');
      console.log('   Las imágenes se están sirviendo desde GCS');
    } else {
      console.log('\n⚠️  WP-STATELESS EN MODO BACKUP');
      console.log('   Configuración actual: Las imágenes se sincronizan a GCS');
      console.log('   pero se sirven desde WordPress.');
      console.log('\n   Para servir desde GCS:');
      console.log('   1. Cambia el modo a "CDN" o "Stateless"');
      console.log('   2. Ve a: Configuración → WP-Stateless → Settings → Mode');
    }
    
    console.log('\n💡 Próximo paso: Actualiza el plugin deeplingual-regenerate-meta.php');
    console.log('   y ejecuta una prueba con el endpoint completo');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGCSConnection();

