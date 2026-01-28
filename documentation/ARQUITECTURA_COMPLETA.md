# 🏗️ Arquitectura Completa del Backend - API DeepLingual 2025

## 📐 Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENTE IA                                │
│                    (Genera Actividades)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     │ {prompt, run_id, n, size, wp_post_id}
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Serverless)                           │
│               api-deeplingual2025.vercel.app                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/images/created_img.js                              │  │
│  │  • Recibe prompt para imágenes                           │  │
│  │  • Llama OpenAI                                          │  │
│  │  • Convierte a JPEG con Sharp                            │  │
│  │  • Sube a WordPress                                      │  │
│  │  • Actualiza campos ACF                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/pedagogical-outputs/                               │  │
│  │  • POST: Crear actividad                                 │  │
│  │  • GET /:id: Obtener por Run ID                          │  │
│  │  • GET /latest: Última actividad                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────┬──────────────────┬──────────────────┬─────────────────────┘
     │                  │                  │
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────┐      ┌──────────┐      ┌────────────┐
│ OpenAI  │      │WordPress │      │  Airtable  │
│   API   │      │   REST   │      │    API     │
└─────────┘      └──────────┘      └────────────┘
```

---

## 🔗 Conexiones Detalladas

### **1. VERCEL Backend → OpenAI API**

```
┌──────────────────────────────────────────────────────────┐
│  Endpoint: /api/images/created_img                       │
└──────────────────────────────────────────────────────────┘
                     │
                     │ 1. Envía Prompt
                     ▼
┌──────────────────────────────────────────────────────────┐
│          https://api.openai.com/v1/images/generations    │
│                                                           │
│  Request:                                                 │
│  {                                                        │
│    "model": "gpt-image-1",                               │
│    "prompt": "Ilustración infantil...",                  │
│    "size": "1024x1024",                                  │
│    "n": 1-3,                                             │
│    "response_format": "b64_json"                         │
│  }                                                        │
│                                                           │
│  Response:                                                │
│  {                                                        │
│    "data": [                                             │
│      { "b64_json": "iVBORw0KGgo..." }                   │
│    ]                                                      │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
                     │
                     │ 2. Recibe Imagen en Base64
                     ▼
```

**Credenciales:** `OPENAI_API_KEY`  
**Protocolo:** HTTPS  
**Método:** POST  
**Formato:** JSON con imagen en Base64

---

### **2. VERCEL Backend → WordPress REST API**

```
┌──────────────────────────────────────────────────────────┐
│  Endpoint: /api/images/created_img                       │
│  (Después de recibir imagen de OpenAI)                   │
└──────────────────────────────────────────────────────────┘
                     │
                     │ 3. Convierte con Sharp
                     │    Buffer → JPEG
                     ▼
┌──────────────────────────────────────────────────────────┐
│     https://twinkle.acuarelacore.com/wp-json/wp/v2/media│
│                                                           │
│  Request:                                                 │
│  Headers:                                                 │
│    Authorization: Bearer {WP_JWT}                        │
│    Content-Type: multipart/form-data; boundary=...      │
│                                                           │
│  FormData:                                                │
│    file: [JPEG Buffer]                                   │
│    filename: "run-id-preview-1.jpg"                      │
│    contentType: "image/jpeg"                             │
│    title: "Preview 1 - run-id"                           │
│    post: [wp_post_id] (opcional)                         │
│                                                           │
│  Response:                                                │
│  {                                                        │
│    "id": 221258,                                         │
│    "source_url": "https://...",                          │
│    "media_type": "image",                                │
│    "mime_type": "image/jpeg"                             │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
                     │
                     │ 4. WordPress guarda y devuelve Media ID
                     ▼
```

**Credenciales:** `WP_JWT` (JWT Token)  
**URL Base:** `WP_URL` (https://twinkle.acuarelacore.com)  
**Protocolo:** HTTPS  
**Método:** POST (subida), PUT (actualización ACF)  
**Formato:** multipart/form-data para archivos, JSON para ACF

---

### **3. WordPress → Google Cloud Storage (GCS) [OPCIONAL]**

```
┌──────────────────────────────────────────────────────────┐
│                    WordPress + WP-Stateless              │
│            https://twinkle.acuarelacore.com              │
└──────────────────────────────────────────────────────────┘
                     │
                     │ Hook: add_attachment
                     │ (Automático cuando se crea media)
                     ▼
┌──────────────────────────────────────────────────────────┐
│               Plugin: WP-Stateless                        │
│                                                           │
│  Modos Disponibles:                                       │
│  • Disabled: No usa GCS                                   │
│  • Backup: Copia a GCS, URLs locales ← ESTABA AQUÍ       │
│  • CDN: Copia a GCS, URLs de GCS                         │
│  • Stateless: Solo GCS, no local                         │
│  • Ephemeral: Solo GCS, local temporal                   │
└──────────────────────────────────────────────────────────┘
                     │
                     │ 5. Sincroniza con GCS
                     │    (Si modo CDN/Stateless)
                     ▼
┌──────────────────────────────────────────────────────────┐
│     https://storage.googleapis.com/bcct-multimedia/      │
│                                                           │
│  Estructura:                                              │
│  bcct-multimedia/                                         │
│    └── sites/                                             │
│        └── 1/                                             │
│            └── 2026/                                      │
│                └── 01/                                    │
│                    └── [hash]-filename.jpg                │
│                                                           │
│  Autenticación:                                           │
│  Service Account JSON (configurado en WP-Stateless)      │
│                                                           │
│  URL Final:                                               │
│  https://storage.googleapis.com/bcct-multimedia/         │
│         sites/1/2026/01/mkd4rb6p-image.jpeg              │
└──────────────────────────────────────────────────────────┘
```

**Bucket:** `bcct-multimedia`  
**Región:** Configurada en GCS  
**Autenticación:** Service Account JSON  
**Protocolo:** HTTPS  
**Método:** Sincronización automática vía WP-Stateless

---

## 🔄 Flujo Completo de Creación de Imagen

```
┌────────────┐
│   AGENTE   │ 1. POST {prompt, run_id, wp_post_id}
└──────┬─────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  VERCEL: /api/images/created_img.js                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  PASO 1: Generar Imagen con OpenAI                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ POST https://api.openai.com/v1/images/...       │    │
│  │ Headers: Authorization: Bearer {OPENAI_API_KEY} │    │
│  │ Body: {model, prompt, size, n}                  │    │
│  │ ← Response: {data: [{b64_json: "..."}]}        │    │
│  └─────────────────────────────────────────────────┘    │
│           ↓                                               │
│  PASO 2: Convertir Imagen                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Buffer.from(b64_json, 'base64')                 │    │
│  │ → sharp(buffer).jpeg({quality: 90}).toBuffer()  │    │
│  │ = jpegBuffer                                     │    │
│  └─────────────────────────────────────────────────┘    │
│           ↓                                               │
│  PASO 3: Subir a WordPress                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ FormData:                                        │    │
│  │   file: jpegBuffer                               │    │
│  │   filename: "run-id-preview-1.jpg"              │    │
│  │   contentType: "image/jpeg"                      │    │
│  │   title: "Preview 1 - run-id"                   │    │
│  │   post: wp_post_id                               │    │
│  │                                                   │    │
│  │ POST https://twinkle.../wp-json/wp/v2/media     │    │
│  │ Headers: Authorization: Bearer {WP_JWT}         │    │
│  │          + FormData headers (boundary)          │    │
│  │ ← Response: {id: 221258, source_url: "..."}    │    │
│  └─────────────────────────────────────────────────┘    │
│           ↓                                               │
│  PASO 4: Regenerar Metadatos (Opcional)                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ POST https://twinkle.../wp-json/deeplingual/... │    │
│  │                  /v1/sync-media/{media_id}      │    │
│  │ Headers: Authorization: Bearer {WP_JWT}         │    │
│  │ ← Response: {success, url, is_gcs}              │    │
│  └─────────────────────────────────────────────────┘    │
│           ↓                                               │
│  PASO 5: Actualizar ACF (Si wp_post_id existe)           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ PUT https://twinkle.../wp-json/wp/v2/           │    │
│  │                  planessemanales/{wp_post_id}   │    │
│  │ Headers: Authorization: Bearer {WP_JWT}         │    │
│  │ Body: {acf: {foto: media_id}}                   │    │
│  │ ← Response: {success}                           │    │
│  └─────────────────────────────────────────────────┘    │
│           ↓                                               │
│  PASO 6: Responder al Agente                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Response: {                                      │    │
│  │   run_id: "...",                                │    │
│  │   wp_post_id: 123,                              │    │
│  │   previews: [                                    │    │
│  │     {media_id: 221258, url: "https://..."}      │    │
│  │   ]                                              │    │
│  │ }                                                │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────┐
│   AGENTE   │ ← Recibe Media IDs y URLs
└────────────┘
```

---

## 🔌 WordPress Plugins y su Rol

```
┌──────────────────────────────────────────────────────────┐
│                      WordPress                            │
│            https://twinkle.acuarelacore.com              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  🔌 JWT Authentication for WP-API                        │
│     • Valida el token Bearer en cada request             │
│     • Identifica al usuario (admin)                      │
│     • Verifica permisos (upload_files)                   │
│                                                           │
│  🔌 Advanced Custom Fields (ACF)                         │
│     • Define campos personalizados (foto, multimedia)    │
│     • Se actualiza vía REST API                          │
│                                                           │
│  🔌 ACF REST API                                          │
│     • Expone campos ACF en REST API                      │
│     • Permite lectura/escritura de campos personalizados │
│                                                           │
│  🔌 DL ACF REST Write                                     │
│     • Habilita escritura de ACF vía REST API             │
│                                                           │
│  🔌 DeepLingual – Regenerar Metadatos                    │
│     • Endpoint: /wp-json/deeplingual/v1/sync-media/:id   │
│     • Regenera thumbnails y metadatos                    │
│     • Detecta WP-Stateless y devuelve info               │
│                                                           │
│  🔌 WP-Stateless [ACTUALMENTE DESACTIVADO]               │
│     • Sincroniza automáticamente a GCS                   │
│     • Reemplaza URLs locales por URLs de GCS             │
│     • Hook: add_attachment                               │
│     • Problema: No funciona bien con REST API uploads    │
│                                                           │
│  🔌 Enable CORS                                           │
│     • Permite requests desde dominios externos           │
│     • Necesario para API desde Vercel                    │
│                                                           │
│  🔌 Simple CPT                                            │
│     • Define Custom Post Type: planessemanales           │
│     • Usado para actividades pedagógicas                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🌐 Integraciones Adicionales

### **Airtable** (Para actividades pedagógicas)

```
┌──────────────────────────────────────────────────────────┐
│  Endpoint: /api/pedagogical-outputs                      │
└──────────────────────────────────────────────────────────┘
                     │
                     │ POST actividad
                     ▼
┌──────────────────────────────────────────────────────────┐
│          https://api.airtable.com/v0/                    │
│                  {AIRTABLE_BASE_ID}/                     │
│                  Pedagogical Outputs                     │
│                                                           │
│  Headers:                                                 │
│    Authorization: Bearer {AIRTABLE_API_KEY}             │
│                                                           │
│  Guarda:                                                  │
│    • Run ID                                              │
│    • Output JSON                                         │
│    • Timestamp                                           │
│    • Needs Clarification                                 │
└──────────────────────────────────────────────────────────┘
```

**Base:** `AIRTABLE_BASE_ID` (applT2mBMFj0VpABr)  
**Tabla:** "Pedagogical Outputs"  
**Logs:** "Event Log"  
**Protocolo:** HTTPS REST API

---

## 🚨 Problema Actual con GCS

```
╔══════════════════════════════════════════════════════════╗
║              PROBLEMA IDENTIFICADO                        ║
╚══════════════════════════════════════════════════════════╝

❌ SÍNTOMA:
   Imágenes subidas vía REST API:
   • Se crea registro en WordPress DB
   • NO se guarda archivo físico (Error 404)
   • URL generada pero inaccesible

✅ FUNCIONA:
   Imágenes subidas manualmente en WordPress Admin:
   • Archivo físico se guarda
   • URL accesible
   • WP-Stateless sincroniza a GCS (modo configurado)

🔍 DIAGNÓSTICO:
   1. WP-Stateless no sincroniza uploads vía REST API
   2. Posible problema de permisos en /wp-content/uploads/
   3. Conflicto entre plugins (WP-Stateless, Sucuri, Anti-Duplicados)
   4. WordPress acepta upload pero no escribe archivo

⚠️  ESTADO ACTUAL:
   • WP-Stateless: DESACTIVADO
   • Sucuri Security: DESACTIVADO (?)
   • Problema persiste → Indica problema de servidor

🔧 SOLUCIÓN EN CURSO:
   • Verificar permisos: chmod 755 /wp-content/uploads/
   • Probar subida manual en WordPress Admin
   • Contactar hosting si problema persiste
```

---

## 🔐 Variables de Entorno Necesarias

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# WordPress
WP_URL=https://twinkle.acuarelacore.com
WP_JWT=eyJ0eXAiOiJKV1QiLCJh...

# Airtable
AIRTABLE_API_KEY=patpG8D9m58uw4LIe...
AIRTABLE_BASE_ID=applT2mBMFj0VpABr
AIRTABLE_TABLE_NAME=Pedagogical Outputs
AIRTABLE_LOGS_TABLE_NAME=Event Log

# API Authentication
API_TOKEN=YjIwZmRlOWItNzA5Mi00MDFkLWFkYWMt...
```

---

## 📦 Dependencias del Backend

```json
{
  "dependencies": {
    "airtable": "^0.12.2",    // Cliente Airtable API
    "axios": "^1.7.7",         // HTTP client (mejor que fetch para FormData)
    "form-data": "^4.0.0",     // Manejo de multipart/form-data
    "sharp": "^0.33.5"         // Procesamiento de imágenes
  }
}
```

---

## 🎯 Flujo Alternativo sin GCS (Actual)

```
AGENTE → VERCEL → OpenAI (genera imagen)
              ↓
           Sharp (convierte a JPEG)
              ↓
       WordPress REST API (guarda local)
              ↓
       Plugin DeepLingual (regenera metadata)
              ↓
       ACF Update (asocia a post)
              ↓
       Response al AGENTE con URLs locales
```

**URL Final:** `https://twinkle.acuarelacore.com/wp-content/uploads/2026/01/imagen.jpg`

---

## 🚀 Próximos Pasos

1. ✅ **Backend corregido** (FormData, axios, logging)
2. ✅ **Plugin WordPress actualizado** (sync-media endpoint)
3. ⚠️  **Resolver problema de permisos del servidor**
4. 🔄 **Opcional: Reactivar WP-Stateless en modo CDN**
5. 🚀 **Desplegar a producción**

---

**Estado Actual:** Backend funcional, esperando resolución de permisos del servidor.

