/**
 * 🔍 Verificar plugins activos que podrían interferir
 */

const axios = require('axios');

const WP_URL = "https://twinkle.acuarelacore.com";
const WP_JWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3R3aW5rbGUuYWN1YXJlbGFjb3JlLmNvbSIsImlhdCI6MTc2ODA1OTQwMCwibmJmIjoxNzY4MDU5NDAwLCJleHAiOjE3Njg2NjQyMDAsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.zQXetd5ttwen--rUp2Pz6WVa9EDWxbiWdWJQpbWUqVk";

async function checkSystem() {
  console.log('🔍 Verificando sistema WordPress...\n');
  
  try {
    // 1. Verificar plugins
    console.log('📦 Intentando obtener lista de plugins...');
    try {
      const pluginsResp = await axios.get(
        `${WP_URL}/wp-json/wp/v2/plugins`,
        {
          headers: { 'Authorization': `Bearer ${WP_JWT}` }
        }
      );
      
      console.log(`\n✅ Plugins activos (${pluginsResp.data.length}):`);
      pluginsResp.data.forEach(plugin => {
        if (plugin.status === 'active') {
          console.log(`   - ${plugin.name}`);
        }
      });
    } catch (err) {
      console.log('   ⚠️  No se pudo obtener lista de plugins (endpoint puede estar deshabilitado)');
    }
    
    // 2. Verificar configuración de uploads
    console.log('\n📁 Verificando configuración de medios...');
    try {
      const settingsResp = await axios.get(
        `${WP_URL}/wp-json/wp/v2/settings`,
        {
          headers: { 'Authorization': `Bearer ${WP_JWT}` }
        }
      );
      
      console.log('   Título del sitio:', settingsResp.data.title);
      console.log('   URL:', settingsResp.data.url);
    } catch (err) {
      console.log('   ⚠️  No se pudo obtener configuración');
    }
    
    // 3. Intentar subir archivo muy pequeño
    console.log('\n📤 Intentando subida básica...');
    const FormData = require('form-data');
    
    // Archivo de 1 píxel transparente
    const tinyPNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=',
      'base64'
    );
    
    const form = new FormData();
    form.append('file', tinyPNG, {
      filename: `tiny-test-${Date.now()}.png`,
      contentType: 'image/png'
    });
    
    try {
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
      
      console.log('   ✅ Subida exitosa');
      console.log('   Media ID:', uploadResp.data.id);
      console.log('   URL:', uploadResp.data.source_url);
      
      // Verificar si es accesible
      try {
        await axios.head(uploadResp.data.source_url, { timeout: 5000 });
        console.log('   ✅ ARCHIVO FÍSICO EXISTE Y ES ACCESIBLE');
        console.log('\n🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
        console.log('   El problema anterior podría haber sido:');
        console.log('   - WP-Stateless causando conflictos');
        console.log('   - Plugin anti-duplicados');
        console.log('   - Caché temporal');
      } catch (err) {
        console.log('   ❌ ARCHIVO NO ACCESIBLE (404)');
        console.log('\n⚠️  PROBLEMA CRÍTICO:');
        console.log('   WordPress acepta la subida pero no guarda el archivo físico');
        console.log('\n🔧 Posibles causas:');
        console.log('   1. Permisos incorrectos en /wp-content/uploads/');
        console.log('   2. Directorio de uploads no existe');
        console.log('   3. Plugin de seguridad bloqueando escritura');
        console.log('   4. Disco lleno en el servidor');
        console.log('\n💡 Verifica en tu servidor:');
        console.log('   chmod 755 /wp-content/uploads/ -R');
        console.log('   chown www-data:www-data /wp-content/uploads/ -R');
      }
      
    } catch (err) {
      console.log('   ❌ Error en subida:', err.response?.data || err.message);
    }
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

checkSystem();

























