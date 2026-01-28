# Guía de Configuración

Esta guía te ayudará a configurar el proyecto desde cero.

## Requisitos Previos

- **Node.js**: Versión 14.x o superior
- **npm** o **yarn**: Gestor de paquetes
- **Cuenta de Airtable**: Con base de datos creada
- **WordPress**: Instalación con REST API habilitada
- **JWT Plugin para WordPress**: Para autenticación (opcional, según tu configuración)

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd api_deeplingual2025
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará:
- `airtable`: ^0.12.2

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto. Ver [Variables de Entorno](./05-variables-entorno.md) para detalles completos.

```bash
# .env
API_TOKEN=tu_token_secreto_aqui
AIRTABLE_API_KEY=tu_api_key_de_airtable
AIRTABLE_BASE_ID=tu_base_id_de_airtable
AIRTABLE_TABLE_NAME=Pedagogical Outputs
AIRTABLE_LOGS_TABLE_NAME=Event Log
WP_URL=https://tu-wordpress.com
WP_JWT=tu_jwt_token_de_wordpress
```

### 4. Configurar Airtable

#### Crear Base de Datos

1. Ve a [Airtable](https://airtable.com) y crea una nueva base
2. Anota el **Base ID** (visible en la URL o en la documentación de la API)

#### Crear Tabla "Pedagogical Outputs"

Crea una tabla con los siguientes campos:

| Nombre del Campo | Tipo | Descripción |
|------------------|------|-------------|
| Run ID | Single line text | Identificador único de la ejecución |
| Output JSON | Long text | JSON stringificado de la actividad |
| Needs Clarification | Checkbox | Indica si necesita aclaración |
| Created At | Created time | Fecha de creación (automático) |
| Updated At | Last modified time | Fecha de última modificación (automático) |

#### Crear Tabla "Event Log"

Crea una tabla para logs con los siguientes campos:

| Nombre del Campo | Tipo | Descripción |
|------------------|------|-------------|
| Event | Single line text | Nombre del evento |
| Level | Single select | info, warn, error |
| Run ID | Single line text | ID de la ejecución relacionada |
| Agent | Single line text | Agente que generó la actividad |
| Duration Ms | Number | Duración en milisegundos |
| Message | Long text | Mensaje del evento |
| Stack | Long text | Stack trace (si aplica) |
| Details JSON | Long text | Detalles adicionales en JSON |
| Created At | Created time | Fecha de creación (automático) |

#### Obtener API Key

1. Ve a tu perfil en Airtable
2. Accede a "Account" → "Developer hub"
3. Crea un nuevo "Personal access token"
4. Copia el token (solo se muestra una vez)

### 5. Configurar WordPress

#### Habilitar REST API

La REST API de WordPress está habilitada por defecto en WordPress 4.7+. Verifica que esté accesible:

```
https://tu-wordpress.com/wp-json/
```

#### Crear Custom Post Type

Necesitas un custom post type llamado `planessemanales`. Esto puede hacerse con un plugin o código personalizado.

#### Configurar Campos ACF (Advanced Custom Fields)

Instala el plugin ACF y crea los siguientes campos para el post type `planessemanales`:

- `instrucciones` (Text Area)
- `materiales` (Text Area)
- `materiales_reciclables` (Text Area)
- `objetivos` (Text Area)
- `pasos` (Text Area)
- `tips` (Text Area)
- `instrucciones_de_evaluacion` (Text Area)

#### Obtener JWT Token

Dependiendo de tu configuración de WordPress, necesitarás:

1. **JWT Authentication Plugin**: Si usas un plugin JWT
   - Instala el plugin
   - Genera un token usando las credenciales de un usuario con permisos

2. **Application Password**: Si WordPress soporta application passwords
   - Ve a Usuarios → Tu Perfil
   - Crea una nueva "Application Password"
   - Úsala como token

3. **OAuth**: Si usas OAuth, sigue la documentación de tu proveedor

### 6. Verificar Configuración

Crea un script de prueba o usa curl para verificar:

```bash
# Verificar endpoint de WordPress
curl https://tu-wordpress.com/wp-json/wp/v2/planessemanales

# Verificar autenticación (reemplaza con tu token)
curl -H "Authorization: Bearer tu_jwt_token" \
     https://tu-wordpress.com/wp-json/wp/v2/users/me
```

## Configuración para Desarrollo Local

### Usar Vercel CLI (Recomendado)

```bash
npm install -g vercel
vercel dev
```

Esto iniciará un servidor local que simula el entorno de Vercel.

### Usar Node.js Directamente

Si prefieres ejecutar directamente con Node.js, necesitarás un servidor HTTP. Puedes usar Express o similar:

```javascript
// server.js (ejemplo)
const http = require('http');
const handler = require('./api/pedagogical-outputs');

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Configuración para Producción

### Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Despliega

### Otra Plataforma

Asegúrate de:
- Configurar todas las variables de entorno
- Habilitar HTTPS
- Configurar rate limiting (recomendado)
- Configurar monitoreo y alertas

## Verificación Post-Instalación

### 1. Probar Endpoint de Creación

```bash
curl -X POST http://localhost:3000/api/pedagogical-outputs \
  -H "Authorization: Bearer tu_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "test_001",
    "output_json": {
      "tema": "Test Activity",
      "instrucciones": "This is a test"
    },
    "needs_clarification": false
  }'
```

### 2. Verificar en Airtable

- Ve a tu base de Airtable
- Verifica que se creó el registro en "Pedagogical Outputs"
- Verifica que se crearon logs en "Event Log"

### 3. Verificar en WordPress

- Ve al admin de WordPress
- Verifica que se creó el post en "Planessemanales"
- Verifica que los campos ACF están poblados

### 4. Probar Endpoint de Consulta

```bash
curl -X GET http://localhost:3000/api/pedagogical-outputs/test_001 \
  -H "Authorization: Bearer tu_API_TOKEN"
```

## Solución de Problemas Comunes

### Error: "Unauthorized: Bearer token required"

- Verifica que el header `Authorization` esté presente
- Verifica que el formato sea `Bearer <token>` (con espacio)
- Verifica que `API_TOKEN` en `.env` coincida

### Error: "Airtable error"

- Verifica que `AIRTABLE_API_KEY` sea correcta
- Verifica que `AIRTABLE_BASE_ID` sea correcta
- Verifica que la tabla "Pedagogical Outputs" exista
- Verifica permisos de la API key en Airtable

### Error: "WordPress error"

- Verifica que `WP_URL` sea correcta y accesible
- Verifica que `WP_JWT` sea válido
- Verifica que el custom post type `planessemanales` exista
- Verifica que los campos ACF estén configurados
- Revisa los logs de WordPress para más detalles

### Error: "Missing required fields"

- Verifica que el body incluya:
  - `run_id` (string)
  - `output_json` (object)
  - `needs_clarification` (boolean)

### Logs no se guardan

- Verifica que la tabla "Event Log" exista en Airtable
- Verifica que los campos de la tabla coincidan con los esperados
- Revisa la consola para errores de logging (no bloquean el flujo principal)

## Próximos Pasos

Una vez configurado:

1. Lee la [Documentación de API](./02-api-endpoints.md) para entender los endpoints
2. Revisa los [Flujos de Proceso](./03-flujos-proceso.md) para entender el comportamiento
3. Consulta los [Diagramas de Secuencia](./06-diagramas-secuencia.md) para ver interacciones detalladas

## Recursos Adicionales

- [Documentación de Airtable API](https://airtable.com/api)
- [Documentación de WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Documentación de Vercel](https://vercel.com/docs)



























