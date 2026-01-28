# Documentación de API - Endpoints

## Base URL

```
https://tu-dominio.com/api
```

## Autenticación

Todos los endpoints requieren autenticación mediante Bearer Token en el header:

```
Authorization: Bearer <API_TOKEN>
```

### Respuestas de Error de Autenticación

```json
{
  "error": "Unauthorized: Bearer token required"
}
```

```json
{
  "error": "Unauthorized: Invalid token"
}
```

---

## Endpoints

### 1. Crear Actividad Pedagógica

**POST** `/api/pedagogical-outputs`

Crea una nueva actividad pedagógica, guardándola en Airtable y publicándola en WordPress.

#### Headers

```
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

#### Request Body

```json
{
  "run_id": "string (requerido)",
  "output_json": {
    "tema": "string",
    "instrucciones": "string",
    "materiales": "string",
    "materiales_reciclables": "string",
    "objetivos": "string",
    "pasos": ["string"] | "string",
    "tips": "string",
    "instrucciones_de_evaluacion": "string",
    "slug": "string",
    "tipo_de_actividad": "string"
  },
  "needs_clarification": boolean (requerido)
}
```

#### Ejemplo de Request

```json
{
  "run_id": "run_12345",
  "output_json": {
    "tema": "Exploración sensorial con texturas",
    "instrucciones": "Permite a los niños explorar diferentes texturas...",
    "materiales": "Algodón, arena, agua, plastilina",
    "materiales_reciclables": "Botellas, tapas",
    "objetivos": "Desarrollar sensibilidad táctil",
    "pasos": [
      "Preparar los materiales",
      "Presentar las texturas",
      "Permitir exploración libre"
    ],
    "tips": "Supervisar constantemente",
    "instrucciones_de_evaluacion": "Observar la reacción del niño",
    "slug": "exploracion-sensorial-texturas",
    "tipo_de_actividad": "exploración sensorial"
  },
  "needs_clarification": false
}
```

#### Respuesta Exitosa (201 Created)

```json
{
  "message": "Proceso completado",
  "airtable": {
    "success": true,
    "record": {
      "id": "recXXXXXXXXXXXXXX",
      "run_id": "run_12345",
      "output_json": { ... },
      "needs_clarification": false,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  },
  "wordpress": {
    "success": true,
    "post": {
      "id": 123,
      "title": "Exploración sensorial con texturas",
      "status": "draft",
      "slug": "exploracion-sensorial-texturas",
      ...
    }
  }
}
```

#### Respuestas de Error

**400 Bad Request** - Campos faltantes
```json
{
  "error": "Bad Request",
  "message": "Missing required fields: run_id, output_json, needs_clarification"
}
```

**401 Unauthorized** - Token inválido o faltante
```json
{
  "error": "Unauthorized: Bearer token required"
}
```

**500 Internal Server Error** - Error en procesamiento
```json
{
  "error": "Internal Server Error",
  "message": "Error message here"
}
```

#### Notas

- El proceso guarda en Airtable y WordPress en paralelo
- Si una operación falla, la otra puede seguir exitosamente
- El post en WordPress se crea con status "draft"
- Los campos ACF se construyen automáticamente desde `output_json`

---

### 2. Obtener Actividad por Run ID

**GET** `/api/pedagogical-outputs/:id`

Obtiene una actividad específica usando su Run ID.

#### Headers

```
Authorization: Bearer <API_TOKEN>
```

#### Parámetros de URL

- `id` (requerido): El Run ID de la actividad a buscar

#### Ejemplo de Request

```
GET /api/pedagogical-outputs/run_12345
Authorization: Bearer <API_TOKEN>
```

#### Respuesta Exitosa (200 OK)

```json
{
  "data": {
    "id": "recXXXXXXXXXXXXXX",
    "documentId": "recXXXXXXXXXXXXXX",
    "attributes": {
      "run_id": "run_12345",
      "output_json": {
        "tema": "Exploración sensorial con texturas",
        "instrucciones": "...",
        ...
      },
      "needs_clarification": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  },
  "meta": {}
}
```

#### Respuestas de Error

**400 Bad Request** - Run ID faltante
```json
{
  "error": "Bad Request",
  "message": "Run ID parameter is required"
}
```

**404 Not Found** - Actividad no encontrada
```json
{
  "error": "Not Found",
  "message": "Record with Run ID \"run_12345\" not found"
}
```

**401 Unauthorized** - Token inválido
```json
{
  "error": "Unauthorized: Invalid token"
}
```

---

### 3. Obtener Última Actividad

**GET** `/api/pedagogical-outputs/latest`

Obtiene la última actividad creada, ordenada por fecha de creación descendente.

#### Headers

```
Authorization: Bearer <API_TOKEN>
```

#### Ejemplo de Request

```
GET /api/pedagogical-outputs/latest
Authorization: Bearer <API_TOKEN>
```

#### Respuesta Exitosa (200 OK)

```json
{
  "data": {
    "id": "recXXXXXXXXXXXXXX",
    "documentId": "recXXXXXXXXXXXXXX",
    "attributes": {
      "run_id": "run_67890",
      "output_json": { ... },
      "needs_clarification": false,
      "createdAt": "2025-01-15T11:00:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  },
  "meta": {}
}
```

#### Respuestas de Error

**404 Not Found** - No hay registros
```json
{
  "error": "Not Found",
  "message": "No se encontraron registros"
}
```

**401 Unauthorized** - Token inválido
```json
{
  "error": "Unauthorized: Invalid token"
}
```

---

### 4. Publicar en WordPress (Alternativo)

**POST** `/api/api_wp`

Endpoint alternativo para publicación directa en WordPress. Crea el post con status "publish" inmediatamente.

#### Headers

```
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

#### Request Body

```json
{
  "run_id": "string (requerido)",
  "output_json": {
    "tema": "string",
    "content": "string (JSON stringificado)"
  }
}
```

#### Respuesta Exitosa (201 Created)

```json
{
  "message": "Actividad guardada correctamente",
  "wordpress_post": {
    "id": 123,
    "title": "Título de la actividad",
    "status": "publish",
    ...
  }
}
```

#### Notas

- Este endpoint NO guarda en Airtable
- El post se publica inmediatamente (status: "publish")
- El contenido se envía como JSON stringificado

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos o faltantes |
| 401 | Unauthorized - Token inválido o faltante |
| 404 | Not Found - Recurso no encontrado |
| 405 | Method Not Allowed - Método HTTP no permitido |
| 500 | Internal Server Error - Error del servidor |

## Formato de Respuesta

Todas las respuestas exitosas de GET siguen el formato similar a Strapi:

```json
{
  "data": {
    "id": "string",
    "documentId": "string",
    "attributes": {
      "run_id": "string",
      "output_json": { ... },
      "needs_clarification": boolean,
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date"
    }
  },
  "meta": {}
}
```

## Rate Limiting

Actualmente no hay límites de rate limiting implementados. Se recomienda implementar en producción.

## Versionado

Actualmente no hay versionado de API. Todos los endpoints están en `/api/`.

## Ejemplos de Uso

### cURL - Crear Actividad

```bash
curl -X POST https://tu-dominio.com/api/pedagogical-outputs \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "run_12345",
    "output_json": {
      "tema": "Mi actividad",
      "instrucciones": "Instrucciones aquí"
    },
    "needs_clarification": false
  }'
```

### cURL - Obtener por ID

```bash
curl -X GET https://tu-dominio.com/api/pedagogical-outputs/run_12345 \
  -H "Authorization: Bearer tu_token_aqui"
```

### cURL - Obtener Última

```bash
curl -X GET https://tu-dominio.com/api/pedagogical-outputs/latest \
  -H "Authorization: Bearer tu_token_aqui"
```

### JavaScript (Fetch)

```javascript
const response = await fetch('https://tu-dominio.com/api/pedagogical-outputs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tu_token_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    run_id: 'run_12345',
    output_json: {
      tema: 'Mi actividad',
      instrucciones: 'Instrucciones aquí'
    },
    needs_clarification: false
  })
});

const data = await response.json();
```



























