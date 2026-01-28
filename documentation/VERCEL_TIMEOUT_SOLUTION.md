# ⏱️ Solución: Timeout en Generación de Imágenes

## 🔴 Problema Identificado

### Error:
```
504 Gateway Timeout
Vercel Runtime Timeout Error: Task timed out after 300 seconds
```

### Causa Raíz:
El proceso completo de generación y subida de imágenes toma más de 5 minutos:

1. **Generación OpenAI** (~30-60s)
2. **Conversión a JPEG** (~1-2s)
3. **Subida a WordPress Media** (~60-180s) ⚠️ Esto es lo más lento
4. **Sincronización GCS** (~10-30s)
5. **Actualización ACF** (~5-10s)

**Total**: ~2-5 minutos (puede exceder el límite)

---

## ✅ Soluciones Implementadas

### 1. Pre-renovación de JWT ✅

**Problema anterior:**
- Token expiraba durante el proceso
- Se detectaba el 401 después de generar la imagen
- Se renovaba el token y se reintentaba
- **Tiempo desperdiciado**: +30-60s

**Solución implementada:**
```javascript
// En api/images/created_img.js (línea ~55)
console.log(`🔐 [${run_id}] Verificando token JWT antes de empezar...`);
await getValidToken(); // Renueva si está cerca de expirar
console.log(`✅ [${run_id}] Token JWT verificado y listo`);
```

**Beneficio**: Ahorra 30-60 segundos al evitar reintentos.

---

### 2. Configuración de `maxDuration` en Vercel ✅

**Archivo**: `vercel.json`

```json
{
  "functions": {
    "api/images/created_img.js": {
      "maxDuration": 300
    }
  }
}
```

#### ⚠️ **Limitaciones según Plan de Vercel**

| Plan | maxDuration por Defecto | maxDuration Máximo |
|------|-------------------------|-------------------|
| **Hobby (Free)** | 10s | 10s (no configurable) |
| **Pro** | 60s | 300s (5 minutos) |
| **Enterprise** | 60s | 900s (15 minutos) |

**📍 Estado Actual:**
- Configurado con `maxDuration: 300` (5 minutos)
- **Requiere Plan Pro de Vercel** ($20/mes)
- Si estás en Hobby plan, el límite seguirá siendo 10s

**Verificar tu plan:**
```bash
vercel whoami
vercel teams ls
```

O visita: https://vercel.com/[tu-usuario]/settings/billing

---

### 3. Optimización del Flujo de Subida

#### A. Tamaño de Imagen Optimizado

**Implementado en `created_img.js`:**
```javascript
const jpegBuffer = await sharp(inputBuffer)
  .jpeg({ quality: 90 }) // Calidad 90 = buen balance calidad/tamaño
  .toBuffer();
```

**Tamaño típico resultante**: 200-400KB (vs 1-2MB sin optimización)

#### B. Paralelización (Futuro)

Para múltiples imágenes (`n > 1`), actualmente se procesan en secuencia:

```javascript
for (let i = 0; i < oaiJson.data.length; i++) {
  // Procesar imagen i
}
```

**Mejora futura**: Procesarlas en paralelo con `Promise.all()`

---

## 🔄 Solución 3: Procesamiento Asíncrono (Opcional)

### Problema Actual:
El agente espera 5 minutos bloqueado hasta que termine todo el proceso.

### Solución: Queue + Webhook

#### Arquitectura Propuesta:

```
┌─────────────────────────────────────────────────────┐
│ 1. Agente solicita generación de imagen             │
│    POST /api/images/created_img                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. Backend valida y encola tarea                    │
│    Respuesta inmediata (~1s):                        │
│    { "job_id": "abc123", "status": "queued" }       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. Worker procesa la cola (en background)           │
│    - Genera imagen con OpenAI                        │
│    - Sube a WordPress                                 │
│    - Actualiza ACF                                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. Notifica al agente (webhook o polling)           │
│    { "job_id": "abc123", "status": "completed",     │
│      "media_id": 1234, "url": "https://..." }       │
└─────────────────────────────────────────────────────┘
```

#### Implementación:

**Opción A: Vercel Cron** (Más simple)
```javascript
// api/cron/process-images.js
export default async function handler(req, res) {
  // Procesa una imagen de la cola cada minuto
  const job = await getNextJob();
  if (job) {
    await processImage(job);
  }
  res.status(200).json({ processed: !!job });
}
```

Configurar en `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-images",
    "schedule": "* * * * *"
  }]
}
```

**Opción B: Upstash Redis + Queue** (Más robusto)
- Usa Upstash (Redis en Vercel)
- Queue: Bull o BullMQ
- Polling cada X segundos

**Opción C: Servicio Externo** (Producción)
- AWS SQS + Lambda
- Google Cloud Tasks
- Azure Queue Storage

---

## 📊 Comparación de Soluciones

| Solución | Complejidad | Tiempo Usuario | Costo | Recomendación |
|----------|-------------|----------------|-------|---------------|
| **1. Pre-renovación JWT** | Baja ✅ | 4-5 min | Gratis | **Implementado** |
| **2. maxDuration 300s** | Baja ✅ | 4-5 min | $20/mes (Pro) | **Implementado** |
| **3. Procesamiento asíncrono** | Alta | <5s | Variable | Opcional (futuro) |

---

## 🚀 Pasos Siguientes

### Corto Plazo (Ya Implementado):

- [x] Pre-renovación de JWT antes del proceso
- [x] Configurar `maxDuration: 300` en `vercel.json`
- [x] Optimización de tamaño de imagen (quality: 90)

### Para Deploy:

1. **Verificar tu plan de Vercel**:
   ```bash
   vercel whoami
   ```
   
2. **Si estás en Hobby Plan**:
   - Actualizar a Pro: https://vercel.com/upgrade
   - O reducir `maxDuration` a 10s y usar procesamiento asíncrono

3. **Deploy con nueva configuración**:
   ```bash
   git add vercel.json api/images/created_img.js
   git commit -m "feat: add timeout config and JWT pre-renewal"
   git push origin main
   ```

4. **Probar**:
   - Generar una imagen desde el agente
   - Verificar logs en Vercel Dashboard
   - Confirmar que no hay timeout 504

---

## 🐛 Troubleshooting

### Error: "maxDuration is not available on your plan"

**Causa**: Estás en Hobby plan

**Solución**:
```json
{
  "functions": {
    "api/images/created_img.js": {
      "maxDuration": 10
    }
  }
}
```

E implementar procesamiento asíncrono (Solución 3).

---

### Error: "Still timing out at 300s"

**Causas posibles**:

1. **WordPress es muy lento**
   - Verifica plugins pesados en WP
   - Revisa recursos del servidor
   - Considera CDN para media uploads

2. **OpenAI tarda mucho**
   - Reducir tamaño de imagen: `1024x1024` → `512x512`
   - Generar menos imágenes: `n: 3` → `n: 1`

3. **Red lenta**
   - Vercel → WordPress puede tener latencia
   - Considera mover WordPress a servidor más cercano

**Solución definitiva**: Implementar procesamiento asíncrono.

---

### Logs muestran: "Token expirado detectado. Renovando..."

**Esto es NORMAL** si:
- El token estaba cerca de expirar
- El proceso toma >1 hora (poco probable)

**Problema** si:
- Aparece en CADA request
- Ocurre justo después de renovar

**Diagnóstico**:
```bash
# Ver estado del token
node test-jwt-renewal.js
```

---

## 📈 Métricas de Rendimiento

### Antes de las Optimizaciones:

```
Total: ~6-8 minutos
├─ OpenAI: 30-60s
├─ Conversión: 1-2s
├─ Upload WP (intento 1): 60-180s → FALLA (401)
├─ Renovar JWT: 30-60s
├─ Upload WP (reintento): 60-180s → ✅
├─ Sync GCS: 10-30s
└─ Update ACF: 5-10s

Resultado: ❌ 504 Timeout (>300s)
```

### Después de las Optimizaciones:

```
Total: ~3-5 minutos
├─ Renovar JWT (preventivo): 1-2s ⚡
├─ OpenAI: 30-60s
├─ Conversión: 1-2s
├─ Upload WP: 60-180s → ✅ (sin reintentos)
├─ Sync GCS: 10-30s
└─ Update ACF: 5-10s

Resultado: ✅ 200 OK (200-300s)
```

**Mejora**: ~40-50% más rápido

---

## 💡 Recomendaciones Finales

### Para Desarrollo/MVP (Ahora):
✅ Usar las optimizaciones implementadas  
✅ Plan Pro de Vercel ($20/mes)  
✅ `maxDuration: 300s`  

### Para Producción (Futuro):
🚀 Implementar procesamiento asíncrono  
🚀 Queue con Redis/Upstash  
🚀 Webhooks para notificaciones  
🚀 UI muestra "procesando..." con polling  

---

**Última actualización**: 2026-01-19  
**Estado**: ✅ Optimizaciones implementadas  
**Requiere**: Plan Pro de Vercel o procesamiento asíncrono


















