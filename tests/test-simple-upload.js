/**
 * 🧪 Test Simple de Subida (sin plugin DeepLingual)
 */

const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const WP_URL = "https://twinkle.acuarelacore.com";
const WP_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2ODA1OTQwMCwibmJmIjoxNzY4MDU5NDAwLCJleHAiOjE3Njg2NjQyMDAsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.zQXetd5ttwen--rUp2Pz6WVa9EDWxbiWdWJQpbWUqVk";

async function testSimpleUpload() {
  console.log('🧪 Test Simple: Subida sin plugin DeepLingual\n');
  
  try {
    // Crear imagen única
    const testImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 100, g: 150, b: 200, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    console.log('📤 Subiendo imagen...');
    
    const form = new FormData();
    form.append('file', testImage, {
      filename: `test-simple-${Date.now()}.png`,
      contentType: 'image/png'
    });
    form.append('title', 'Test Simple CDN Mode');
    
    const response = await axios.post(
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
    
    const mediaId = response.data.id;
    const url = response.data.source_url;
    
    console.log('✅ Imagen subida');
    console.log('   Media ID:', mediaId);
    console.log('   URL:', url);
    
    // Verificar si es URL de GCS
    if (url.includes('storage.googleapis.com') || url.includes('storage.cloud.google.com')) {
      console.log('\n✅ ¡ÉXITO! URL de Google Cloud Storage');
    } else {
      console.log('\n⚠️  URL es de WordPress local');
    }
    
    // Esperar un poco para que WP-Stateless sincronice
    console.log('\n⏳ Esperando 3 segundos...');
    await new Promise(r => setTimeout(r, 3000));
    
    // Verificar URL
    console.log('\n🔍 Verificando accesibilidad...');
    try {
      const checkResp = await axios.head(url, { timeout: 10000 });
      console.log('   ✅ URL accesible (HTTP', checkResp.status + ')');
      
      // Verificar si redirige a GCS
      if (checkResp.request?.res?.responseUrl) {
        const finalUrl = checkResp.request.res.responseUrl;
        console.log('   Redirected to:', finalUrl);
        if (finalUrl.includes('storage.googleapis.com')) {
          console.log('   ✅ Redirige a GCS');
        }
      }
    } catch (err) {
      console.log('   ❌ URL NO accesible:', err.message);
    }
    
    // Obtener metadata actualizada
    console.log('\n📊 Obteniendo metadata actualizada...');
    const mediaResp = await axios.get(
      `${WP_URL}/wp-json/wp/v2/media/${mediaId}`,
      {
        headers: { 'Authorization': `Bearer ${WP_JWT}` }
      }
    );
    
    const updatedUrl = mediaResp.data.source_url;
    console.log('   URL actualizada:', updatedUrl);
    
    if (updatedUrl.includes('storage.googleapis.com')) {
      console.log('\n🎉 CONFIGURACIÓN CORRECTA');
      console.log('   WP-Stateless en modo CDN funcionando');
    } else {
      console.log('\n⚠️  PROBLEMA DE CONFIGURACIÓN');
      console.log('   Verifica:');
      console.log('   1. File URL Replacement debe estar habilitado');
      console.log('   2. Mode debe ser CDN (no Backup)');
      console.log('   3. Guarda cambios y limpia caché');
    }
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSimpleUpload();

























