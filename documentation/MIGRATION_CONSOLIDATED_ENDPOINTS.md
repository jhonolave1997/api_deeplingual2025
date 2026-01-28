# 🔄 Guía de Migración: Endpoints Consolidados

## 📋 Resumen del Cambio

Hemos consolidado **4 endpoints duplicados en 2 endpoints únicos** que funcionan para cualquier tipo de actividad:

### ❌ Antes (Duplicados):

```
api/pedagogical-outputs/latest.js       → Solo curriculum
api/pedagogical-outputs/[id].js          → Solo curriculum  
api/pedagogical-outputs-logic/latest.js  → Solo lógico-matemáticas
api/pedagogical-outputs-logic/[id].js    → Solo lógico-matemáticas
```

### ✅ Ahora (Consolidados):

```
api/images/latest.js  → Cualquier tipo (detecta automáticamente)
api/images/[id].js    → Cualquier tipo (detecta automáticamente)
```

---

## 🎯 Beneficios

1. **Menos código duplicado** - De 4 archivos a 2
2. **Más simple de mantener** - Un solo lugar para actualizar
3. **Detección automática** - Identifica el tipo por el `run_id`
4. **Misma funcionalidad** - Compatible con flujos existentes

---

## 🗂️ Archivos Nuevos Creados

| Archivo | Descripción | Reemplaza a |
|---------|-------------|-------------|
| **`api/images/latest.js`** | Obtiene la actividad más reciente (cualquier tipo) | - `api/pedagogical-outputs/latest.js`<br>- `api/pedagogical-outputs-logic/latest.js` |
| **`api/images/[id].js`** | Obtiene actividad por Run ID (cualquier tipo) | - `api/pedagogical-outputs/[id].js`<br>- `api/pedagogical-outputs-logic/[id].js` |
| **`openapi-schema-updated.json`** | Schema OpenAPI actualizado | - Schema anterior |

---

## 🔍 Cómo Funciona la Detección Automática

Los nuevos endpoints detectan el tipo de actividad basándose en el **prefijo del `run_id`**:

```javascript
// Actividades Curriculares
"deep-lingual-*"     → planessemanales (campos: foto, multimedia)
"deeplingual-*"      → planessemanales

// Actividades Lógico-Matemáticas
"deepgraphic-*"      → actividadlogicomatematica (campos: plantilla_es, plantilla_en)
"deep-graphic-*"     → actividadlogicomatematica

// Por defecto (sin prefijo reconocido)
"otro-*"             → planessemanales (fallback)
```

---

## 📊 Comparación de Respuestas

### Antes:

```json
// GET /api/pedagogical-outputs/latest
{
  "data": {
    "id": "recABC",
    "attributes": {
      "run_id": "deep-lingual-2025-01-19T10:00:00Z",
      "created_at": "2025-01-19T10:00:00.000Z",
      "wp_post_id": 456,
      "output": { "tema": "La familia" }
    }
  }
}
```

### Ahora (con info adicional):

```json
// GET /api/images/latest
{
  "data": {
    "id": "recABC",
    "attributes": {
      "run_id": "deep-lingual-2025-01-19T10:00:00Z",
      "created_at": "2025-01-19T10:00:00.000Z",
      "wp_post_id": 456,
      "activity_type": "curriculum",           // ← NUEVO
      "wp_endpoint": "planessemanales",        // ← NUEVO
      "default_fields": ["foto"],              // ← NUEVO
      "output": { "tema": "La familia" }
    }
  }
}
```

**Campos nuevos útiles:**
- **`activity_type`**: Tipo de actividad (`curriculum` o `logic`)
- **`wp_endpoint`**: Endpoint de WordPress correspondiente
- **`default_fields`**: Campos ACF por defecto para este tipo

---

## 🚀 Pasos para Migrar

### Paso 1: Actualizar el Action Schema en OpenAI

1. Ve a tu GPT Assistant en OpenAI
2. Click en "Configure" → "Actions"
3. Reemplaza el schema actual con el contenido de: **`openapi-schema-updated.json`**
4. Click "Save"

### Paso 2: Actualizar las Instructions del Agente

En las instrucciones de tu agente, reemplaza las referencias:

#### ❌ Antes:
```
Para obtener la última actividad curricular:
- Usar: /api/pedagogical-outputs/latest

Para obtener la última actividad lógico-matemática:
- Usar: /api/pedagogical-outputs-logic/latest

Para obtener actividad por ID:
- Curriculum: /api/pedagogical-outputs/{id}
- Lógico-matemática: /api/pedagogical-outputs-logic/{id}
```

#### ✅ Ahora:
```
Para obtener la última actividad (cualquier tipo):
- Usar: /api/images/latest
- La respuesta incluye "activity_type" que indica si es curriculum o logic

Para obtener actividad por Run ID:
- Usar: /api/images/{id}
- Funciona con cualquier run_id (deep-lingual-* o deepgraphic-*)

Para generar imagen:
- El run_id determina automáticamente el endpoint de WordPress
- deep-lingual-* → guarda en planessemanales (campo: foto)
- deepgraphic-* → guarda en actividadlogicomatematica (campo: plantilla_es)
```

### Paso 3: Deploy a Vercel

```bash
# Commit los cambios
git add api/images/latest.js api/images/[id].js openapi-schema-updated.json
git commit -m "feat: consolidate endpoints - reduce from 4 to 2 unified endpoints"

# Push a Vercel
git push origin main
```

### Paso 4: (Opcional) Eliminar Archivos Antiguos

Una vez que confirmes que todo funciona con los nuevos endpoints:

```bash
# Eliminar los archivos antiguos
rm api/pedagogical-outputs/latest.js
rm api/pedagogical-outputs/[id].js
rm api/pedagogical-outputs-logic/latest.js
rm api/pedagogical-outputs-logic/[id].js

# Commit
git add -A
git commit -m "chore: remove deprecated endpoints"
git push origin main
```

**⚠️ Importante:** NO elimines `index.js` de esas carpetas, ya que manejan la creación de actividades (POST), no la lectura (GET).

---

## 📝 Cambios en el Flujo del Agente

### Flujo Anterior:

```
1. Crear actividad → POST /api/pedagogical-outputs/
2. Obtener wp_post_id → GET /api/pedagogical-outputs/latest
3. Generar imagen → POST /api/images/created_img
```

### Flujo Nuevo (Mejorado):

```
1. Crear actividad → POST /api/pedagogical-outputs/ (o /pedagogical-outputs-logic/)
2. Obtener wp_post_id → GET /api/images/latest
   ↳ Respuesta incluye: activity_type, wp_endpoint, default_fields
3. Generar imagen → POST /api/images/created_img
   ↳ El backend usa run_id para determinar dónde guardar automáticamente
```

---

## 🧪 Pruebas

### Prueba 1: Obtener Última Actividad

```bash
# Antes
curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/pedagogical-outputs/latest

# Ahora
curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/images/latest
```

### Prueba 2: Obtener por Run ID

```bash
# Antes (curriculum)
curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/pedagogical-outputs/deep-lingual-123

# Antes (lógico-matemática)
curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/pedagogical-outputs-logic/deepgraphic-456

# Ahora (ambos)
curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/images/deep-lingual-123

curl -H "Authorization: Bearer $API_TOKEN" \
  https://api-deeplingual2025.vercel.app/api/images/deepgraphic-456
```

### Prueba 3: Generar Imagen (Sin Cambios)

```bash
# Funciona igual que antes, pero ahora con detección automática
curl -X POST \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Ilustración infantil de una familia",
    "wp_post_id": 456,
    "run_id": "deep-lingual-2025-01-19T10:00:00Z",
    "n": 1
  }' \
  https://api-deeplingual2025.vercel.app/api/images/created_img
```

---

## 🔄 Compatibilidad hacia Atrás

### Durante la Transición:

- ✅ Los endpoints **antiguos siguen funcionando** (si no los eliminas)
- ✅ Los endpoints **nuevos ya funcionan** inmediatamente
- ✅ Puedes usar ambos en paralelo mientras migras

### Después de la Migración:

- ✅ Solo usas los nuevos endpoints
- ✅ Eliminas los archivos antiguos
- ✅ Reduces complejidad del código

---

## 📊 Impacto en el Agente de OpenAI

### Cambios Mínimos Requeridos:

1. **Actualizar Action Schema** (nuevo JSON)
2. **Actualizar Instructions** (opcional, pero recomendado)
3. **Sin cambios en lógica** - El agente sigue funcionando igual

### Mejoras para el Agente:

1. **Menos confusión** - Un solo endpoint en vez de dos
2. **Más información** - La respuesta incluye `activity_type`
3. **Más robusto** - Detección automática reduce errores

---

## ✅ Checklist de Migración

- [ ] Revisar nuevos archivos: `api/images/latest.js` y `api/images/[id].js`
- [ ] Actualizar Action Schema en OpenAI con `openapi-schema-updated.json`
- [ ] (Opcional) Actualizar Instructions del agente
- [ ] Hacer commit y push a Vercel
- [ ] Probar endpoint `/api/images/latest`
- [ ] Probar endpoint `/api/images/{id}` con ambos tipos de run_id
- [ ] Verificar que generación de imágenes funciona
- [ ] (Opcional) Eliminar archivos antiguos después de confirmar que todo funciona

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'api/images/latest'"

**Causa:** Archivos no se subieron a Vercel

**Solución:**
```bash
git add api/images/
git commit -m "fix: add consolidated endpoints"
git push origin main
```

### El agente no encuentra el endpoint

**Causa:** Action Schema no actualizado

**Solución:** Actualiza el schema en OpenAI con `openapi-schema-updated.json`

### La respuesta no incluye "activity_type"

**Causa:** Usando el endpoint antiguo

**Solución:** Usa `/api/images/latest` en lugar de `/api/pedagogical-outputs/latest`

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs en Vercel Dashboard
2. Confirma que los archivos están en `api/images/`
3. Verifica el Action Schema en OpenAI
4. Prueba los endpoints manualmente con curl

---

**Fecha de migración:** 2026-01-19  
**Versión del schema:** 2.0.0  
**Estado:** ✅ Listo para implementar

