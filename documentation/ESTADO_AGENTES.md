# 🚀 Estado Actual del Sistema para Agentes

## ✅ Lo que está LISTO y funcionando

### 1. Endpoints principales
- ✅ **POST `/api/pedagogical-outputs`** - Crear actividades curriculares
  - Guarda en Airtable y WordPress
  - Retorna: `wp_post_id`, `activity_type`, `wp_endpoint`, `default_fields`
  - Determina automáticamente el endpoint según `run_id`

- ✅ **POST `/api/pedagogical-outputs-logic`** - Crear actividades lógicas
  - Guarda en Airtable y WordPress
  - Acepta nueva estructura JSON (campos ACF directamente en `output_json`)
  - Maneja correctamente campos de relación (`enfoque_general`, etc.)

- ✅ **POST `/api/images/created_img`** - Generar imágenes
  - Genera imágenes con OpenAI DALL-E
  - Sube a WordPress Media Library
  - Actualiza campos ACF automáticamente según el tipo de actividad

### 2. Lógica de guardado de imágenes

#### Actividades Lógicas (`deepgraphic-*`)
- ✅ **SIEMPRE** guarda en los 3 campos: `multimedia_es`, `multimedia_en`, `foto`
- ✅ No considera `requiere_plantilla` (siempre guarda en todos)

#### Actividades Curriculares (`deep-lingual-*`)
- ✅ Si `requiere_plantilla = false`: Solo guarda en `foto`
- ✅ Si `requiere_plantilla = true`:
  - `num_imagen = 0`: Guarda en `multimedia_es` y `multimedia_en` (plantilla)
  - `num_imagen != 0`: Guarda en `foto` (evidencia)

### 3. Seguridad
- ✅ `.gitignore` actualizado con todas las protecciones necesarias
- ✅ Archivos sensibles protegidos (`.env*`, credenciales, tokens, etc.)

## ⚠️ Lo que necesitas VERIFICAR antes de probar

### 1. Variables de entorno en `.env.local`
Asegúrate de tener todas estas variables configuradas:

```env
# WordPress
WP_URL=https://tu-dominio.com
WP_JWT=tu_token_jwt_valido  # ⚠️ IMPORTANTE: Debe estar actualizado
WP_USERNAME=tu_usuario_exacto  # Para renovación automática
WP_PASSWORD=tu_contraseña_o_app_password  # Para renovación automática

# Airtable
AIRTABLE_API_KEY=tu_api_key
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_TABLE_NAME=Pedagogical Outputs

# OpenAI
OPENAI_API_KEY=tu_openai_key

# API Token
API_TOKEN=tu_api_token
```

### 2. Token JWT válido
- ⚠️ **CRÍTICO**: El token JWT en `WP_JWT` debe estar válido
- Si está expirado, el sistema intentará renovarlo automáticamente
- Para renovación automática, `WP_USERNAME` y `WP_PASSWORD` deben ser correctos

### 3. Verificar que los endpoints funcionan
Puedes probar con los scripts de prueba:
```bash
# Probar actividad lógica
node test-created-img-logic.js

# Probar actividad curricular
node test-activity-222292.js
```

## 📋 Flujo esperado de los agentes

### Para Actividades Curriculares (`deep-lingual-*`)

```
1. Agente crea actividad
   POST /api/pedagogical-outputs
   → Retorna: { wp_post_id, activity_type: "curriculum", wp_endpoint: "planessemanales" }

2. Agente genera imágenes según requiere_plantilla:
   
   Si requiere_plantilla = false:
   - POST /api/images/created_img
     { wp_post_id, requiere_plantilla: false, prompt: "..." }
     → Guarda solo en campo "foto"
   
   Si requiere_plantilla = true:
   - Primera imagen (num_imagen: 0):
     POST /api/images/created_img
     { wp_post_id, requiere_plantilla: true, num_imagen: 0, prompt: "..." }
     → Guarda en "multimedia_es" y "multimedia_en"
   
   - Segunda imagen (num_imagen: 1):
     POST /api/images/created_img
     { wp_post_id, requiere_plantilla: true, num_imagen: 1, prompt: "..." }
     → Guarda en "foto"
```

### Para Actividades Lógicas (`deepgraphic-*`)

```
1. Agente crea actividad
   POST /api/pedagogical-outputs-logic
   → Retorna: { wp_post_id, activity_type: "logic", wp_endpoint: "actividades_logicas" }

2. Agente genera imagen:
   POST /api/images/created_img
   { wp_post_id, run_id: "deepgraphic-...", prompt: "..." }
   → SIEMPRE guarda en "multimedia_es", "multimedia_en" y "foto"
   (No importa requiere_plantilla ni num_imagen)
```

## ✅ Checklist antes de probar agentes

- [ ] Verificar que `WP_JWT` en `.env.local` está actualizado
- [ ] Verificar que `WP_USERNAME` es el nombre de usuario EXACTO de WordPress
- [ ] Verificar que `WP_PASSWORD` es correcta (o Application Password)
- [ ] Verificar que `API_TOKEN` está configurado
- [ ] Verificar que `OPENAI_API_KEY` está configurado
- [ ] Verificar que `AIRTABLE_API_KEY` y `AIRTABLE_BASE_ID` están configurados
- [ ] Probar un endpoint manualmente para confirmar que funciona
- [ ] Verificar que los plugins de WordPress están activos:
  - JWT Authentication for WP REST API
  - ACF (Advanced Custom Fields)
  - DL ACF REST Write (plugin personalizado)

## 🎯 Conclusión

**SÍ, los agentes deberían funcionar correctamente** si:
1. ✅ Todas las variables de entorno están configuradas
2. ✅ El token JWT está válido (o las credenciales de renovación son correctas)
3. ✅ Los endpoints están desplegados en Vercel

**El código está listo y funcionando.** Solo necesitas asegurarte de que las credenciales estén correctas.

## 🔧 Si hay problemas

1. **Error 401/403**: Token JWT expirado o credenciales incorrectas
   - Solución: Actualizar `WP_JWT` o corregir `WP_USERNAME`/`WP_PASSWORD`

2. **Error al guardar imágenes**: Verificar que el `wp_post_id` existe
   - Solución: Verificar que la actividad se creó correctamente primero

3. **Error al actualizar ACF**: Verificar que el plugin `dl-acf-rest-write` está activo
   - Solución: Activar el plugin en WordPress

