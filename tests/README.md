# 🧪 Tests y Scripts de Prueba

Esta carpeta contiene todos los scripts de prueba y testing del proyecto.

## Scripts de Prueba de Endpoints

### Actividades
- `test-activity-222292.js` - Prueba completa para actividad pedagógica específica
- `test-pedagogical-outputs-logic.js` - Prueba de endpoint de actividades lógicas
- `test-dual-activity-flow.js` - Prueba de flujo dual de actividades

### Imágenes
- `test-created-img-logic.js` - Prueba de creación de imágenes para actividades lógicas
- `test-image-creation.js` - Prueba general de creación de imágenes
- `test-simple-upload.js` - Prueba simple de subida de imágenes
- `test-final.js` - Prueba final de imágenes
- `test-gcs-connection.js` - Prueba de conexión a Google Cloud Storage
- `test-check-gcs-sync.js` - Verificación de sincronización GCS

### Autenticación y JWT
- `test-jwt-generation.js` - Prueba de generación de tokens JWT
- `test-jwt-renewal.js` - Prueba de renovación de tokens JWT
- `test-new-token.js` - Prueba de nuevo token
- `test-credentials.js` - Prueba de credenciales
- `generate-token.js` - Generador de tokens JWT

### Configuración y Variables
- `test-all-vercel-env.js` - Prueba de todas las variables de Vercel
- `test-vercel-vars-direct.js` - Prueba directa de variables Vercel

### Otros
- `test-email-sending.js` - Prueba de envío de correos
- `test-check-plugins.js` - Verificación de plugins de WordPress
- `test-code-validation.js` - Validación de código
- `test-routing-logic.js` - Prueba de lógica de routing

## Cómo ejecutar los tests

### Requisitos
1. Tener configurado `.env.local` con todas las variables necesarias
2. Tener instaladas las dependencias: `npm install`

### Ejecutar un test
```bash
node tests/test-nombre-del-test.js
```

### Ejemplos
```bash
# Probar creación de imágenes
node tests/test-image-creation.js

# Probar actividades lógicas
node tests/test-pedagogical-outputs-logic.js

# Generar nuevo token JWT
node tests/generate-token.js
```

## Notas

- Todos los tests requieren las variables de entorno configuradas
- Algunos tests pueden requerir tokens JWT válidos
- Los tests de imágenes pueden tardar 30-60 segundos (generación con OpenAI)
- Algunos tests pueden modificar datos en WordPress (usar con precaución)

