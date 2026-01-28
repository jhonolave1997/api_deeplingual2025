/**
 * 🧪 Verificar si las imágenes están realmente en GCS
 */

const axios = require('axios');

const WP_URL = "https://twinkle.acuarelacore.com";
const WP_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2ODA1OTQwMCwibmJmIjoxNzY4MDU5NDAwLCJleHAiOjE3Njg2NjQyMDAsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.zQXetd5ttwen--rUp2Pz6WVa9EDWxbiWdWJQpbWUqVk";

async function checkLastImages() {
  console.log('🔍 Verificando últimas imágenes subidas...\n');
  
  try {
    // Obtener las últimas 5 imágenes
    const response = await axios.get(
      `${WP_URL}/wp-json/wp/v2/media?per_page=5&orderby=date&order=desc`,
      {
        headers: { 'Authorization': `Bearer ${WP_JWT}` }
      }
    );
    
    console.log(`📊 Últimas ${response.data.length} imágenes:\n`);
    
    for (let i = 0; i < response.data.length; i++) {
      const media = response.data[i];
      const url = media.source_url;
      const isGCS = url.includes('storage.googleapis.com');
      
      console.log(`${i + 1}. Media ID: ${media.id}`);
      console.log(`   Título: ${media.title.rendered}`);
      console.log(`   Fecha: ${new Date(media.date).toLocaleString()}`);
      console.log(`   URL: ${url}`);
      console.log(`   Tipo: ${isGCS ? '✅ GCS' : '⚠️  WordPress Local'}`);
      
      // Verificar accesibilidad
      try {
        await axios.head(url, { timeout: 5000 });
        console.log(`   Accesible: ✅ SÍ`);
      } catch (err) {
        console.log(`   Accesible: ❌ NO (${err.response?.status || err.message})`);
      }
      
      console.log('');
    }
    
    // Análisis
    const gcsCount = response.data.filter(m => m.source_url.includes('storage.googleapis.com')).length;
    const localCount = response.data.length - gcsCount;
    
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN:');
    console.log('═'.repeat(60));
    console.log(`Imágenes en GCS: ${gcsCount}/${response.data.length}`);
    console.log(`Imágenes locales: ${localCount}/${response.data.length}`);
    
    if (gcsCount > 0 && localCount > 0) {
      console.log('\n💡 DIAGNÓSTICO:');
      console.log('   Algunas imágenes están en GCS y otras no.');
      console.log('   Posibles causas:');
      console.log('   - Configuración de WP-Stateless cambió recientemente');
      console.log('   - Imágenes vía API no se sincronizan automáticamente');
      console.log('   - Hay un delay en la sincronización');
    } else if (gcsCount === response.data.length) {
      console.log('\n✅ PERFECTO: Todas las imágenes en GCS');
    } else {
      console.log('\n⚠️  PROBLEMA: Ninguna imagen en GCS');
      console.log('   WP-Stateless no está funcionando correctamente');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

checkLastImages();

























