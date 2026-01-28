# 🚀 Guía de Deploy a Vercel - Renovación Automática JWT

## ✅ Archivos Actualizados

Los siguientes archivos **YA tienen** el sistema de renovación automática de JWT:

1. ✅ **`api/images/created_img.js`** - Subida y gestión de imágenes
2. ✅ **`api/pedagogical-outputs/index.js`** - Actividades curriculares
3. ✅ **`api/pedagogical-outputs-logic/index.js`** - Actividades lógico-matemáticas
4. ✅ **`utils/wp-auth.js`** - Módulo de renovación automática (nuevo)

---

## 📋 Variables de Entorno en Vercel

### 🆕 Nuevas Variables Requeridas

Debes agregar estas **3 nuevas variables** en Vercel:

```env
WP_USERNAME=tu_wp_username_aqui
WP_PASSWORD=tu_wp_password_aqui
```

### ✅ Variables Existentes (mantener)

```env
# Airtable
AIRTABLE_API_KEY=tu_airtable_api_key_aqui
AIRTABLE_BASE_ID=tu_airtable_base_id_aqui
AIRTABLE_LOGS_TABLE_NAME=Event Log
AIRTABLE_TABLE_NAME=Pedagogical Outputs

# OpenAI
OPENAI_API_KEY=tu_openai_api_key_aqui

# WordPress
WP_URL=https://twinkle.acuarelacore.com
WP_JWT=tu_wp_jwt_token_aqui

# API Token
API_TOKEN=tu_api_token_aqui
```

**Nota sobre WP_JWT:** Puede estar expirado, no importa. El sistema lo renovará automáticamente usando WP_USERNAME y WP_PASSWORD.

---

## 🔧 Pasos para Configurar Variables en Vercel

### Opción A: Dashboard de Vercel (Recomendado)

1. **Ve a tu proyecto en Vercel:**
   ```
   https://vercel.com/jhonolaves-projects/api-deeplingual2025
   ```

2. **Click en "Settings" → "Environment Variables"**

3. **Agregar las nuevas variables:**
   
   **Variable 1:**
   - Name: `WP_USERNAME`
   - Value: `tu_wp_username_aqui`
   - Environment: Selecciona **Production, Preview, Development**
   - Click "Save"

   **Variable 2:**
   - Name: `WP_PASSWORD`
   - Value: `tu_wp_password_aqui`
   - Environment: Selecciona **Production, Preview, Development**
   - Click "Save"

4. **Verificar que las demás variables existan**

5. **Hacer Redeploy** (ver siguiente sección)

---

### Opción B: Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Agregar variables
vercel env add WP_USERNAME production
# Cuando pregunte el valor: tu_wp_username_aqui

vercel env add WP_PASSWORD production
# Cuando pregunte el valor: tu_wp_password_aqui

# Hacer deploy
vercel --prod
```

---

## 🚀 Cómo Hacer Deploy

### Método 1: Push a Git (Automático)

Si tienes integración con Git configurada:

```bash
# 1. Commit los cambios
git add .
git commit -m "feat: add JWT auto-renewal system"

# 2. Push a tu rama
git push origin main

# 3. Vercel detectará el push y hará deploy automáticamente
```

### Método 2: Vercel CLI (Manual)

```bash
# En el directorio del proyecto
cd c:\Users\jhono\OneDrive\Documents\GitHub\api_deeplingual2025

# Deploy a producción
vercel --prod

# O preview deploy (para testing)
vercel
```

### Método 3: Dashboard de Vercel

1. Ve a tu proyecto: https://vercel.com/jhonolaves-projects/api-deeplingual2025
2. Click en "Deployments"
3. Click en los 3 puntos (...) del último deployment
4. Click "Redeploy"
5. Confirmar

---

## ✅ Checklist de Deploy

Antes de hacer deploy, verifica:

- [ ] Variables `WP_USERNAME` y `WP_PASSWORD` agregadas en Vercel
- [ ] Todas las variables existentes están configuradas
- [ ] Archivos `utils/wp-auth.js` están en el repositorio
- [ ] No hay errores de linting (`npm run lint` si tienes)
- [ ] Commit y push hechos (si usas Git)

Después del deploy:

- [ ] Deployment exitoso (sin errores de build)
- [ ] Probar endpoint desde OpenAI Agent
- [ ] Verificar logs en Vercel Dashboard
- [ ] Confirmar que posts se crean exitosamente en WordPress

---

## 🧪 Cómo Probar

### 1. Desde OpenAI Agent

Simplemente ejecuta el agente normalmente. Si el JWT está expirado, debería:

1. Detectar el error 401
2. Renovar automáticamente el token
3. Reintentar la petición
4. Crear el post exitosamente

**Resultado esperado:**
```json
{
  "airtable_success": true,
  "wordpress_success": true,
  "airtable_record_id": "recXXX",
  "wordpress_post_id": 123
}
```

### 2. Verificar Logs en Vercel

1. Ve a: https://vercel.com/jhonolaves-projects/api-deeplingual2025
2. Click en "Logs"
3. Filtra por la función que falló
4. Busca estos logs:

```
🔍 [wp-auth] Analizando error 401
⚠️  [wp-auth] Token expirado detectado. Renovando...
🔄 [wp-auth] Renovando token JWT...
✅ [wp-auth] Token renovado exitosamente
WP created post id: 123
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module 'utils/wp-auth'"

**Causa:** El archivo `utils/wp-auth.js` no se subió a Vercel

**Solución:**
```bash
# Verificar que existe
ls utils/wp-auth.js

# Si no existe, crearlo desde el repo
git pull origin main

# Hacer deploy nuevamente
vercel --prod
```

### Error: "WP_USERNAME no está configurado"

**Causa:** Variables de entorno no configuradas en Vercel

**Solución:**
1. Ve a Settings → Environment Variables en Vercel
2. Agrega `WP_USERNAME` y `WP_PASSWORD`
3. Redeploy

### Error: "rest_cannot_create" sigue apareciendo

**Causa:** Token no se está renovando (posibles razones)

**Solución:**
1. Verifica que `WP_USERNAME` y `WP_PASSWORD` son correctos
2. Prueba login en WordPress con esas credenciales
3. Verifica logs para ver si el error es otro (ej: permisos de usuario)
4. Confirma que el plugin JWT está activo en WordPress

### El sistema funciona localmente pero no en Vercel

**Causa:** Variables de entorno no sincronizadas

**Solución:**
```bash
# Descargar variables de Vercel
vercel env pull .env.production

# Comparar con tu .env local
diff .env .env.production

# Agregar las que faltan en Vercel
```

---

## 📊 Comparación: Antes vs Después del Deploy

### ❌ Antes (Error Actual)

```json
{
  "airtable_success": true,
  "wordpress_success": false,
  "wordpress_error": "WP CREATE 401: rest_cannot_create"
}
```

**Causa:** JWT expirado, sin renovación automática

---

### ✅ Después (Con Renovación Automática)

```json
{
  "airtable_success": true,
  "wordpress_success": true,
  "airtable_record_id": "recABC123",
  "wordpress_post_id": 456
}
```

**Proceso:**
1. Detecta JWT expirado (401)
2. Renueva automáticamente con WP_USERNAME/PASSWORD
3. Reintenta petición con nuevo token
4. Post creado exitosamente
5. Todo transparente para el agente de OpenAI

---

## 🎯 Variables de Entorno - Resumen

```env
# ========================================
# 🆕 NUEVAS (Agregar en Vercel)
# ========================================
WP_USERNAME=tu_wp_username_aqui
WP_PASSWORD=tu_wp_password_aqui

# ========================================
# ✅ EXISTENTES (Ya configuradas)
# ========================================
WP_URL=https://twinkle.acuarelacore.com
WP_JWT=<token_puede_estar_expirado>
OPENAI_API_KEY=sk-proj-...
AIRTABLE_API_KEY=patpG8...
AIRTABLE_BASE_ID=applT2...
AIRTABLE_TABLE_NAME=Pedagogical Outputs
AIRTABLE_LOGS_TABLE_NAME=Event Log
API_TOKEN=YjIwZmRlOWItNzA5Mi00MDFkLWFkYWMt...
```

---

## 🚦 Estado Actual

- ✅ **Código actualizado** (3 endpoints con renovación automática)
- ✅ **Tests locales pasando** (validado con tus credenciales)
- ⏳ **Pendiente:** Deploy a Vercel + configurar variables
- ⏳ **Pendiente:** Probar desde OpenAI Agent

---

## 📞 Siguiente Paso

**¡Estás listo para hacer deploy!**

1. Agrega `WP_USERNAME` y `WP_PASSWORD` en Vercel
2. Haz deploy (push a Git o `vercel --prod`)
3. Prueba desde tu agente de OpenAI
4. Confirma que los posts se crean correctamente

Si tienes algún error después del deploy, revisa esta guía y los logs de Vercel.

---

**Última actualización:** 2026-01-19  
**Archivos modificados:** 4 (3 endpoints + 1 módulo nuevo)  
**Estado:** ✅ Listo para deploy




















