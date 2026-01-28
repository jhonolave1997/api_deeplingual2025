# 🔍 Diagnóstico: Correos No Se Están Enviando

## 📋 Problema

Los correos no se están enviando cuando una actividad requiere plantilla.

## 🔍 Posibles Causas

### 1. El campo `requiere_plantilla` no está en `true`

El correo solo se envía si:
- `data.output_json.requiere_plantilla === true` (debe ser exactamente `true`, no `"true"` ni `1`)
- `airtableResult.success === true`
- `wpResult.success === true`

**Verificación:**
- Revisa los logs de Vercel para ver si aparece:
  ```
  📋 [run_id] Verificando si requiere plantilla: true/false
  ```
- Si aparece `false`, el campo `requiere_plantilla` no está siendo establecido correctamente en el `output_json`.

### 2. Variables de entorno no configuradas

El correo requiere estas variables:
- `MANDRILL_API_KEY` - API Key de Mandrill
- `EMAIL_FROM` - Email del remitente
- `EMAIL_TO_TEMPLATES` - Destinatarios (separados por comas)

**Verificación en Vercel:**
1. Ve a: Settings → Environment Variables
2. Verifica que existan:
   - `MANDRILL_API_KEY=tu_mandrill_api_key`
   - `EMAIL_FROM=no-reply@...`
   - `EMAIL_TO_TEMPLATES=email1@..., email2@...`

### 3. Error silencioso en el envío

El error se captura pero puede no estar visible en los logs.

**Verificación:**
- Revisa los logs de Vercel para errores con:
  ```
  ❌ [run_id] Error al enviar correo:
  ```
- Busca en Airtable (tabla "Event Log") eventos con:
  - `event: "template_required_email_failed"`

### 4. API Key de Mandrill inválida

Si la API Key de Mandrill es inválida o no tiene permisos, los correos fallarán.

**Verificación:**
1. Ve a: https://mandrillapp.com/settings
2. Verifica que tu API Key sea válida y esté activa
3. Asegúrate de que el dominio del remitente esté verificado en Mandrill

## ✅ Solución Implementada

He mejorado el código para:

1. **Mejor validación:**
   - Verifica que `MANDRILL_API_KEY` esté configurado antes de enviar correos
   - Mensajes de error más claros

2. **Logs detallados:**
   - Muestra si `requiere_plantilla` es `true` o `false`
   - Muestra el estado de Airtable y WordPress
   - Muestra detalles del envío de correo
   - Muestra errores completos si falla

3. **Mejor manejo de errores:**
   - Captura más información del error
   - Guarda detalles en Airtable para debugging

## 🔧 Pasos para Diagnosticar

### Paso 1: Verificar Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Click en "Functions" → Selecciona el endpoint que falla
3. Revisa los logs más recientes
4. Busca estos mensajes:

```
📋 [run_id] Verificando si requiere plantilla: true/false
📧 [run_id] Enviando correo de plantilla requerida...
✅ [run_id] Correo enviado exitosamente
```

O si falla:

```
❌ [run_id] Error al enviar correo: [mensaje de error]
```

### Paso 2: Verificar en Airtable

1. Ve a la tabla "Event Log" en Airtable
2. Busca eventos recientes con:
   - `event: "template_required_email_sent"` (éxito)
   - `event: "template_required_email_failed"` (fallo)
3. Revisa el campo "Details JSON" para ver más información

### Paso 3: Verificar Variables de Entorno

Ejecuta este script para verificar las variables:

```bash
node test-vercel-vars-direct.js
```

O verifica manualmente en Vercel Dashboard.

### Paso 4: Probar Envío Manual

Crea un script de prueba (requiere instalar resend localmente):

```javascript
// test-email-manual.js
require('dotenv').config();
const { sendTemplateRequiredEmail } = require('./utils/email');

async function test() {
  try {
    const result = await sendTemplateRequiredEmail({
      runId: 'test-123',
      wpPostId: '999',
      title: 'Prueba de Correo',
      airtableRecordId: 'recTest123'
    });
    console.log('✅ Correo enviado:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

## 📊 Checklist de Verificación

- [ ] `MANDRILL_API_KEY` está configurado en Vercel
- [ ] `EMAIL_FROM` está configurado en Vercel
- [ ] `EMAIL_TO_TEMPLATES` está configurado en Vercel
- [ ] El dominio de `EMAIL_FROM` está verificado en Resend
- [ ] `requiere_plantilla` está siendo establecido como `true` en el `output_json`
- [ ] Los logs muestran que se intenta enviar el correo
- [ ] No hay errores en los logs de Vercel

## 🆘 Si el Problema Persiste

1. **Revisa los logs completos** en Vercel para el último request
2. **Verifica en Airtable** la tabla "Event Log" para eventos de email
3. **Prueba enviar un correo manualmente** usando el script de prueba
4. **Verifica en Resend Dashboard** si hay intentos de envío y su estado

## 📝 Notas

- Los correos solo se envían si **TODAS** estas condiciones se cumplen:
  1. `requiere_plantilla === true`
  2. Airtable se guardó exitosamente
  3. WordPress se guardó exitosamente

- Si alguna condición falla, el correo **NO se envía** pero el proceso continúa normalmente.

- Los errores de correo **NO rompen el flujo principal** - las actividades se guardan aunque el correo falle.

---

**Última actualización:** 2026-01-22



