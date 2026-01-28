# 🚀 Guía de Despliegue Rápido

## Paso 1: Instalar Dependencias
```bash
npm install
```

## Paso 2: Probar Localmente (Opcional)
```bash
node test-image-creation.js
```

## Paso 3: Desplegar a Vercel

### Opción A: Desde Git (Recomendado)
```bash
git add .
git commit -m "Fix: Corregir carga física de imágenes a WordPress"
git push
```
Vercel desplegará automáticamente.

### Opción B: Desde CLI de Vercel
```bash
vercel --prod
```

## Paso 4: Verificar el Despliegue

1. **Ver logs en Vercel:**
   - Ve a https://vercel.com/dashboard
   - Selecciona tu proyecto
   - Click en "Functions" → "Logs"

2. **Probar endpoint:**
   ```bash
   curl -X POST https://tu-api.vercel.app/api/images/created_img \
     -H "Content-Type: application/json" \
     -d '{
       "run_id": "test-deploy",
       "prompt": "Ilustración infantil de superhéroes",
       "n": 1,
       "size": "1024x1024"
     }'
   ```

3. **Verificar en WordPress:**
   - Ve a Medios → Librería
   - Busca la imagen recién creada
   - Click en "Ver" → Debe mostrarse sin error 404

## ✅ Señales de Éxito

En los logs de Vercel deberías ver:
- 🎨 Generating images...
- ✅ OpenAI generated images successfully
- 📤 Processing image...
- ✅ Image uploaded to WP - Media ID: XXXXX
- 🎉 Process completed successfully

## ❌ Si algo falla

Ejecuta el script de diagnóstico y envía el resultado:
```bash
node test-image-creation.js > diagnostico.txt 2>&1
```

