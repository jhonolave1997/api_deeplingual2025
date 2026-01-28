/**
 * 🧪 Test Final con Imagen Única
 */

const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const WP_URL = "https://twinkle.acuarelacore.com";
const WP_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2ODA1OTQwMCwibmJmIjoxNzY4MDU5NDAwLCJleHAiOjE3Njg2NjQyMDAsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.zQXetd5ttwen--rUp2Pz6WVa9EDWxbiWdWJQpbWUqVk";

async function testFinal() {
  console.log('🧪 TEST FINAL - Verificando Configuración WP-Stateless\n');
  
  try {
    // Crear imagen ÚNICA con colores aleatorios
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    
    const testImage = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r, g, b, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    const timestamp = Date.now();
    const filename = `test-final-${timestamp}.png`;
    
    console.log('📤 Subiendo imagen de prueba...');
    console.log(`   Archivo: ${filename}`);
    console.log(`   Color: RGB(${r}, ${g}, ${b})`);
    
    const form = new FormData();
    form.append('file', testImage, {
      filename: filename,
      contentType: 'image/png'
    });
    form.append('title', `Test Final ${timestamp}`);
    
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
    
    console.log('\n✅ Imagen subida exitosamente');
    console.log('   Media ID:', mediaId);
    console.log('   URL inicial:', url);
    
    // Verificar tipo de URL
    const isGCS = url.includes('storage.googleapis.com') || url.includes('storage.cloud.google.com');
    const isLocal = url.includes('twinkle.acuarelacore.com');
    
    console.log('\n📊 Análisis de URL:');
    if (isGCS) {
      console.log('   ✅ URL de Google Cloud Storage');
      console.log('   ✅ WP-Stateless configurado correctamente');
    } else if (isLocal) {
      console.log('   ⚠️  URL de WordPress local');
      console.log('   ⚠️  WP-Stateless NO está reemplazando URLs');
    }
    
    // Esperar sincronización
    console.log('\n⏳ Esperando 5 segundos para sincronización...');
    await new Promise(r => setTimeout(r, 5000));
    
    // Verificar accesibilidad
    console.log('\n🔍 Verificando accesibilidad de URL...');
    try {
      const checkResp = await axios.head(url, { 
        timeout: 10000,
        maxRedirects: 5
      });
      console.log('   ✅ URL ACCESIBLE (HTTP', checkResp.status + ')');
      console.log('   Content-Type:', checkResp.headers['content-type']);
      
      // Verificar si redirige
      const finalUrl = checkResp.request?.res?.responseUrl || url;
      if (finalUrl !== url) {
        console.log('   Redirected to:', finalUrl);
        if (finalUrl.includes('storage.googleapis.com')) {
          console.log('   ✅ Redirige a GCS - Configuración correcta');
        }
      }
    } catch (err) {
      console.log('   ❌ URL NO ACCESIBLE');
      console.log('   Error:', err.message);
    }
    
    // Obtener metadata actualizada
    console.log('\n📊 Obteniendo metadata actualizada...');
    const mediaResp = await axios.get(
      `${WP_URL}/wp-json/wp/v2/media/${mediaId}`,
      {
        headers: { 'Authorization': `Bearer ${WP_JWT}` }
      }
    );
    
    const finalUrl = mediaResp.data.source_url;
    console.log('   URL final:', finalUrl);
    
    // Resumen
    console.log('\n' + '═'.repeat(60));
    console.log('📋 RESUMEN DEL TEST:');
    console.log('═'.repeat(60));
    
    if (finalUrl.includes('storage.googleapis.com')) {
      console.log('✅ ÉXITO - WP-Stateless funcionando correctamente');
      console.log('   - Modo CDN activo');
      console.log('   - Archivos en GCS');
      console.log('   - URLs de GCS');
      console.log('\n🎉 ¡Todo listo para producción!');
    } else {
      console.log('⚠️  CONFIGURACIÓN INCOMPLETA');
      console.log('   - Archivos se suben pero URLs no cambian a GCS');
      console.log('\n🔧 Verifica en WP-Stateless:');
      console.log('   1. Mode = CDN ✓');
      console.log('   2. File URL Replacement = Enable Editor & Meta');
      console.log('   3. Guarda cambios');
      console.log('   4. Limpia caché de WordPress');
    }
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFinal();

























