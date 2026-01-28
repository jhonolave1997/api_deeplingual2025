# Variables de Entorno

Este documento describe todas las variables de entorno necesarias para el funcionamiento del proyecto.

## Variables Requeridas

### API_TOKEN

**Descripción**: Token secreto para autenticación de la API. Debe coincidir con el token enviado en el header `Authorization: Bearer <token>`.

**Tipo**: String

**Ejemplo**:
```
API_TOKEN=mi_token_secreto_super_seguro_12345
```

**Uso**: Validación de autenticación en todos los endpoints

**Seguridad**: 
- ⚠️ **NUNCA** compartas este token públicamente
- ⚠️ Usa un token fuerte y aleatorio
- ⚠️ Diferentes entornos (dev/prod) deben tener tokens diferentes

---

### AIRTABLE_API_KEY

**Descripción**: API Key de Airtable para autenticar las peticiones a la API.

**Tipo**: String

**Ejemplo**:
```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXX
```

**Cómo Obtenerla**:
1. Ve a [Airtable Account](https://airtable.com/account)
2. Accede a "Developer hub"
3. Crea un "Personal access token"
4. Copia el token (solo se muestra una vez)

**Uso**: Autenticación en todas las operaciones con Airtable

**Seguridad**: 
- ⚠️ Mantén este token privado
- ⚠️ Revoca tokens antiguos si se comprometen

---

### AIRTABLE_BASE_ID

**Descripción**: ID de la base de datos de Airtable donde se guardan las actividades.

**Tipo**: String

**Ejemplo**:
```
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

**Cómo Obtenerlo**:
1. Ve a tu base en Airtable
2. Ve a "Help" → "API documentation"
3. El Base ID aparece en la URL o en la documentación
4. También está en la URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`

**Uso**: Identifica qué base de Airtable usar

---

### AIRTABLE_TABLE_NAME

**Descripción**: Nombre de la tabla en Airtable donde se guardan las actividades pedagógicas.

**Tipo**: String

**Valor por Defecto**: `"Pedagogical Outputs"`

**Ejemplo**:
```
AIRTABLE_TABLE_NAME=Pedagogical Outputs
```

**Uso**: Nombre de la tabla principal para guardar actividades

**Nota**: El nombre debe coincidir exactamente con el nombre de la tabla en Airtable (case-sensitive)

---

### AIRTABLE_LOGS_TABLE_NAME

**Descripción**: Nombre de la tabla en Airtable donde se guardan los logs de eventos.

**Tipo**: String

**Valor por Defecto**: `"Event Log"`

**Ejemplo**:
```
AIRTABLE_LOGS_TABLE_NAME=Event Log
```

**Uso**: Nombre de la tabla para logging de eventos

**Nota**: El nombre debe coincidir exactamente con el nombre de la tabla en Airtable

---

### WP_URL

**Descripción**: URL base de tu instalación de WordPress (sin barra final).

**Tipo**: String (URL)

**Ejemplo**:
```
WP_URL=https://mi-wordpress.com
```

**Sin barra final**: ✅ `https://mi-wordpress.com`  
**Con barra final**: ❌ `https://mi-wordpress.com/` (se remueve automáticamente)

**Uso**: Base URL para todas las peticiones a WordPress REST API

**Validación**: Debe ser una URL válida y accesible

---

### WP_JWT

**Descripción**: Token JWT o token de autenticación para WordPress REST API.

**Tipo**: String

**Ejemplo**:
```
WP_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Cómo Obtenerlo**:
Depende de tu configuración de WordPress:

1. **JWT Authentication Plugin**:
   - Instala el plugin
   - Genera token usando credenciales de usuario

2. **Application Password** (WordPress 5.6+):
   - Usuarios → Tu Perfil → Application Passwords
   - Crea nueva contraseña de aplicación
   - Úsala como token

3. **OAuth**:
   - Sigue la documentación de tu proveedor OAuth

**Uso**: Autenticación en peticiones POST a WordPress

**Seguridad**: 
- ⚠️ Mantén este token privado
- ⚠️ Usa un usuario con permisos mínimos necesarios

---

## Variables Opcionales

### AGENT_LOG_DIR

**Descripción**: Directorio donde se guardan los logs en archivo (solo si se habilita logging a archivo).

**Tipo**: String (Path)

**Valor por Defecto**: `/tmp/logs` (Vercel-safe)

**Ejemplo**:
```
AGENT_LOG_DIR=/tmp/logs
```

**Uso**: Directorio para archivos de log (solo en endpoints que lo soporten)

**Nota**: En Vercel, solo `/tmp` es escribible

---

### AGENT_LOG_FILE

**Descripción**: Nombre del archivo de log.

**Tipo**: String

**Valor por Defecto**: `agent-usage.log`

**Ejemplo**:
```
AGENT_LOG_FILE=agent-usage.log
```

**Uso**: Nombre del archivo de log (solo si se habilita logging a archivo)

---

## Archivo .env de Ejemplo

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Autenticación API
API_TOKEN=tu_token_secreto_muy_largo_y_aleatorio_aqui

# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Pedagogical Outputs
AIRTABLE_LOGS_TABLE_NAME=Event Log

# WordPress
WP_URL=https://tu-wordpress.com
WP_JWT=tu_jwt_token_de_wordpress_aqui

# Logging (Opcional)
AGENT_LOG_DIR=/tmp/logs
AGENT_LOG_FILE=agent-usage.log
```

## Variables por Entorno

### Desarrollo Local

```bash
API_TOKEN=dev_token_12345
WP_URL=http://localhost:8080
# ... resto de variables
```

### Staging

```bash
API_TOKEN=staging_token_diferente
WP_URL=https://staging.tu-wordpress.com
# ... resto de variables
```

### Producción

```bash
API_TOKEN=prod_token_super_seguro_y_largo
WP_URL=https://tu-wordpress.com
# ... resto de variables
```

## Validación de Variables

El sistema valida las siguientes variables al inicio (implícitamente):

- ✅ `API_TOKEN`: Debe existir y no estar vacío
- ✅ `AIRTABLE_API_KEY`: Debe existir para operaciones con Airtable
- ✅ `AIRTABLE_BASE_ID`: Debe existir para operaciones con Airtable
- ✅ `WP_URL`: Debe existir para operaciones con WordPress
- ✅ `WP_JWT`: Debe existir para operaciones con WordPress

**Nota**: El sistema no valida explícitamente al inicio, pero fallará en runtime si faltan variables requeridas.

## Seguridad

### ⚠️ NUNCA hagas commit del archivo .env

Asegúrate de que `.env` esté en `.gitignore`:

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### ⚠️ Usa diferentes tokens por entorno

- Desarrollo: Token de desarrollo
- Staging: Token diferente
- Producción: Token de producción (más seguro)

### ⚠️ Rota tokens regularmente

- Cambia `API_TOKEN` periódicamente
- Revoca tokens de Airtable antiguos
- Regenera JWT de WordPress si se compromete

### ⚠️ Usa secretos en plataformas de despliegue

En Vercel, Netlify, etc., configura las variables de entorno en el dashboard, no en código.

## Verificación

Para verificar que todas las variables están configuradas:

```bash
# En Node.js
console.log('API_TOKEN:', process.env.API_TOKEN ? '✅' : '❌');
console.log('AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅' : '❌');
console.log('AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅' : '❌');
console.log('WP_URL:', process.env.WP_URL ? '✅' : '❌');
console.log('WP_JWT:', process.env.WP_JWT ? '✅' : '❌');
```

## Troubleshooting

### Variable no se lee

- Verifica que el archivo `.env` esté en la raíz del proyecto
- Verifica que no haya espacios alrededor del `=`
- Verifica que no haya comillas innecesarias (a menos que el valor las requiera)
- Reinicia el servidor después de cambiar `.env`

### Variable tiene valor incorrecto

- Verifica que no haya espacios al inicio o final del valor
- Verifica que no haya caracteres especiales sin escapar
- Verifica que el valor no esté entre comillas si no es necesario

### Variable funciona en local pero no en producción

- Verifica que esté configurada en el dashboard de tu plataforma (Vercel, etc.)
- Verifica que el nombre de la variable sea exactamente el mismo
- Verifica que no haya diferencias de mayúsculas/minúsculas



























