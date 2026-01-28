# ✅ Migración: Resend → Mandrill

## 📋 Cambios Realizados

Se ha migrado completamente el sistema de envío de correos de **Resend** a **Mandrill**.

### Archivos Modificados

1. **`utils/email.js`**
   - ❌ Eliminado: `Resend` y `RESEND_API_KEY`
   - ✅ Agregado: Integración con Mandrill usando `axios`
   - ✅ Nueva variable: `MANDRILL_API_KEY`

2. **`package.json`**
   - ❌ Eliminado: `"resend": "^4.0.0"` de dependencias

3. **`env.template`**
   - ❌ Eliminado: Referencias a `RESEND_API_KEY`
   - ✅ Agregado: `MANDRILL_API_KEY` y documentación

4. **`test-email-sending.js`**
   - ✅ Actualizado: Ahora usa Mandrill en lugar de Resend

5. **`test-vercel-vars-direct.js`**
   - ✅ Actualizado: Función `testResend()` → `testMandrill()`

6. **`DIAGNOSTICO_CORREOS.md`**
   - ✅ Actualizado: Referencias cambiadas de Resend a Mandrill

7. **`SOLUCION_DOMINIO_RESEND.md`**
   - ❌ Eliminado: Ya no es necesario

---

## 🔧 Configuración en Vercel

### Variables de Entorno Requeridas

Agrega estas variables en Vercel Dashboard:

```env
MANDRILL_API_KEY=tu_mandrill_api_key_aqui
EMAIL_FROM=no-reply@bilingualchildcaretraining.com
EMAIL_TO_TEMPLATES=jhonolave@bilingualchildcaretraining.com, tecnologia@bilingualchildcaretraining.com
```

### Pasos para Configurar

1. **Obtén tu API Key de Mandrill:**
   - Ve a: https://mandrillapp.com/settings
   - Crea o copia tu API Key

2. **Agrega en Vercel:**
   - Ve a: Settings → Environment Variables
   - Agrega: `MANDRILL_API_KEY` con tu API Key
   - Aplica a: Production, Preview, Development

3. **Elimina la variable antigua (opcional):**
   - Puedes eliminar `RESEND_API_KEY` si ya no la necesitas

4. **Haz redeploy:**
   - Los cambios se aplicarán automáticamente en el próximo deploy

---

## ✅ Funcionalidades

### Lo que se mantiene igual:

- ✅ La función `sendTemplateRequiredEmail()` funciona igual
- ✅ Los parámetros son los mismos
- ✅ El formato del correo es el mismo
- ✅ Los logs y manejo de errores son similares

### Lo que cambia:

- ✅ Usa Mandrill API en lugar de Resend API
- ✅ Variable de entorno: `MANDRILL_API_KEY` en lugar de `RESEND_API_KEY`
- ✅ No requiere verificación de dominio (Mandrill maneja esto diferente)

---

## 🧪 Pruebas

### Probar localmente:

```bash
# Asegúrate de tener MANDRILL_API_KEY en tu .env
node test-email-sending.js
```

### Probar en Vercel:

1. Haz deploy de los cambios
2. Ejecuta una actividad que requiera plantilla
3. Revisa los logs en Vercel para ver:
   ```
   📧 [email] Enviando correo de plantilla requerida con Mandrill...
   ✅ [email] Correo enviado exitosamente con Mandrill
   ```

---

## 📝 Notas Importantes

1. **API Key de Mandrill:**
   - Obtén tu API Key en: https://mandrillapp.com/settings
   - Asegúrate de que tenga permisos para enviar correos

2. **Dominio del remitente:**
   - El dominio de `EMAIL_FROM` debe estar verificado en Mandrill
   - Ve a: https://mandrillapp.com/settings/sending-domains

3. **Límites:**
   - Revisa los límites de tu plan de Mandrill
   - El plan gratuito tiene límites de envío

---

## 🆘 Troubleshooting

### Error: "Invalid_Key"
- Verifica que `MANDRILL_API_KEY` sea correcta
- Asegúrate de que la API Key esté activa en Mandrill

### Error: "ValidationError"
- Verifica que `EMAIL_FROM` sea un email válido
- Verifica que `EMAIL_TO_TEMPLATES` contenga emails válidos

### Los correos no llegan
- Revisa la bandeja de spam
- Verifica que el dominio del remitente esté verificado en Mandrill
- Revisa los logs en Mandrill Dashboard

---

**Última actualización:** 2026-01-22  
**Estado:** ✅ Migración completada







