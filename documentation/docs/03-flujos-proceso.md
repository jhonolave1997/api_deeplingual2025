# Flujos de Proceso

Este documento describe los flujos principales del sistema con diagramas y explicaciones detalladas.

## 1. Flujo Principal: Creación de Actividad Pedagógica

### Diagrama de Flujo

```
┌─────────────────┐
│  Agente de IA   │
│  Envía POST     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Método HTTP    │
│  (debe ser POST)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Autenticación  │
│  (Bearer Token)         │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Válido? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 401 Error    │
    │ + Log Warning│
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Validar Body           │
│  - run_id               │
│  - output_json          │
│  - needs_clarification  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Válido? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 400 Error    │
    │ + Log Warning│
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Log: request_received │
│  (Airtable Event Log)  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Procesar en Paralelo   │
│                         │
│  ┌──────────┐  ┌──────┐ │
│  │ Airtable │  │  WP  │ │
│  └────┬─────┘  └──┬───┘ │
│       │           │     │
│       ▼           ▼     │
│  ┌──────────┐ ┌──────┐ │
│  │ Guardar  │ │Crear │ │
│  │ Record   │ │ Post │ │
│  └────┬─────┘ └──┬───┘ │
│       │           │     │
│       └─────┬─────┘     │
│             │           │
└─────────────┼───────────┘
              │
              ▼
┌─────────────────────────┐
│  Log: process_completed │
│  (con resultados)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Respuesta 201          │
│  {                      │
│    airtable: {...},     │
│    wordpress: {...}     │
│  }                      │
└─────────────────────────┘
```

### Descripción Paso a Paso

1. **Recepción de Request**
   - El agente de IA envía un POST a `/api/pedagogical-outputs`
   - Incluye Bearer Token en headers
   - Body contiene: `run_id`, `output_json`, `needs_clarification`

2. **Validación de Método**
   - Verifica que el método sea POST
   - Si no, retorna 405 Method Not Allowed

3. **Validación de Autenticación**
   - Extrae token del header `Authorization: Bearer <token>`
   - Compara con `process.env.API_TOKEN`
   - Si no coincide, retorna 401 Unauthorized y registra log de advertencia

4. **Validación de Body**
   - Verifica presencia de `run_id` (string)
   - Verifica presencia de `output_json` (object)
   - Verifica presencia de `needs_clarification` (boolean)
   - Si falta algún campo, retorna 400 Bad Request y registra log

5. **Logging Inicial**
   - Registra evento `request_received` en Airtable (tabla Event Log)
   - Incluye: run_id, needs_clarification, agent (si disponible)

6. **Procesamiento Paralelo**
   - **Airtable**: Crea registro en tabla "Pedagogical Outputs"
     - Campos: Run ID, Output JSON (stringificado), Needs Clarification
   - **WordPress**: Crea post en custom post type `planessemanales`
     - Título desde `output_json.tema`
     - Contenido desde `output_json.instrucciones`
     - Status: "draft"
     - Campos ACF construidos desde `output_json`

7. **Logging Final**
   - Registra evento `process_completed` en Airtable
   - Incluye: duración, éxito/fallo de cada operación, errores (si hay)

8. **Respuesta**
   - Retorna 201 Created
   - Incluye resultados de ambas operaciones (Airtable y WordPress)
   - Si una falla, la otra puede seguir exitosamente

### Manejo de Errores

- **Error en Airtable**: Se registra en log, pero WordPress puede seguir
- **Error en WordPress**: Se registra en log, pero Airtable puede seguir
- **Error general**: Se captura, registra en log con stack trace, retorna 500

---

## 2. Flujo de Consulta: Obtener Actividad por ID

### Diagrama de Flujo

```
┌─────────────────┐
│  Cliente        │
│  GET /:id       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Método HTTP    │
│  (debe ser GET)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Autenticación  │
│  (Bearer Token)         │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Válido? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 401 Error    │
    │ + Log Warning│
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Extraer Run ID        │
│  (de URL o query)      │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Existe? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 400 Error    │
    │ + Log Warning│
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Log: get_request_     │
│  received              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Buscar en Airtable    │
│  filterByFormula:      │
│  {Run ID} = "..."      │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Encontrado? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 404 Error    │
    │ + Log Info   │
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Parsear Output JSON    │
│  (desde string)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Log: record_fetched_  │
│  success               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Respuesta 200          │
│  { data: {...} }        │
└─────────────────────────┘
```

### Descripción Paso a Paso

1. **Recepción de Request**
   - Cliente envía GET a `/api/pedagogical-outputs/:id` o `/api/pedagogical-outputs?id=...`
   - Incluye Bearer Token

2. **Validación de Método**
   - Verifica que sea GET
   - Si no, retorna 405 y registra log

3. **Validación de Autenticación**
   - Mismo proceso que en creación

4. **Extracción de Run ID**
   - Intenta obtener de `req.query.id`, `req.query.runId`, `req.query.run_id`
   - Si no está en query, extrae de la URL
   - Si no existe, retorna 400

5. **Logging Inicial**
   - Registra `get_request_received` con run_id y URL

6. **Búsqueda en Airtable**
   - Usa `filterByFormula: '{Run ID} = "..."'`
   - Limita a 1 registro (`maxRecords: 1`)

7. **Verificación de Resultado**
   - Si no se encuentra, retorna 404 y registra log
   - Si se encuentra, continúa

8. **Parseo de JSON**
   - `Output JSON` está almacenado como string en Airtable
   - Se parsea a objeto
   - Si falla el parseo, se registra warning pero se continúa con el string original

9. **Logging Final**
   - Registra `record_fetched_success` con duración y record ID

10. **Respuesta**
    - Retorna 200 OK con formato Strapi-like
    - Incluye todos los campos del registro

---

## 3. Flujo de Consulta: Obtener Última Actividad

### Diagrama de Flujo

```
┌─────────────────┐
│  Cliente        │
│  GET /latest    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Método HTTP    │
│  (debe ser GET)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Validar Autenticación  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Log: latest_request_   │
│  received               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Consultar Airtable     │
│  sort: Created At DESC  │
│  maxRecords: 1          │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Existe? │
    └────┬────┘
         │ NO
         │
         ▼
    ┌──────────────┐
    │ 404 Error    │
    │ + Log Info   │
    └──────────────┘
         │
         │ SÍ
         ▼
┌─────────────────────────┐
│  Parsear Output JSON    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Log: latest_fetched_   │
│  success                │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Respuesta 200          │
│  { data: {...} }        │
└─────────────────────────┘
```

### Descripción Paso a Paso

1. **Recepción y Validación**
   - Similar a obtener por ID, pero sin necesidad de Run ID

2. **Consulta Especial**
   - Ordena por "Created At" descendente
   - Obtiene solo el primer registro

3. **Procesamiento**
   - Similar a obtener por ID
   - Parseo de JSON y construcción de respuesta

---

## 4. Flujo de Logging

### Diagrama de Flujo

```
┌─────────────────┐
│  Evento Ocurre │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Construir Entry        │
│  {                      │
│    event, level,        │
│    run_id, agent,       │
│    duration_ms,         │
│    message, stack,      │
│    details              │
│  }                      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Promise.allSettled     │
│  [                      │
│    Log Airtable,        │
│    Log Archivo          │
│  ]                      │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Éxito?  │
    └────┬────┘
         │
    ┌────┴────┐
    │  NO     │
    │  SÍ     │
    └────┬────┘
         │
         ▼
┌─────────────────────────┐
│  Continuar Flujo        │
│  (no bloquea)          │
└─────────────────────────┘
```

### Tipos de Eventos

| Evento | Nivel | Cuándo se Registra |
|--------|-------|---------------------|
| `request_received` | info | Al recibir POST válido |
| `process_completed` | info | Al completar guardado |
| `invalid_body` | warn | Body inválido |
| `unhandled_exception` | error | Excepción no capturada |
| `get_request_received` | info | Al recibir GET válido |
| `record_fetched_success` | info | Registro encontrado |
| `record_not_found` | info | Registro no encontrado |
| `latest_request_received` | info | Solicitud de último registro |
| `latest_fetched_success` | info | Último registro obtenido |
| `method_not_allowed` | warn | Método HTTP incorrecto |
| `missing_bearer_token` | warn | Token faltante |
| `invalid_token` | warn | Token inválido |
| `output_json_parse_error` | warn | Error parseando JSON |

---

## 5. Flujo de Mapeo de Tipos de Actividad

### Diagrama de Flujo

```
┌─────────────────┐
│  Tipo Raw       │
│  (input)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Normalizar             │
│  - toLowerCase()        │
│  - trim()               │
│  - normalize("NFD")      │
│  - remove accents       │
│  - collapse spaces      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Buscar en Mapa         │
│  TIPO_ACTIVIDAD_MAP     │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Encontrado? │
    └────┬────┘
         │ SÍ
         │
         ▼
    ┌──────────────┐
    │ Retornar     │
    │ Tipo Mapeado │
    └──────────────┘
         │
         │ NO
         ▼
┌─────────────────────────┐
│  Intentar como Slug     │
│  (espacios → _)         │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Encontrado? │
    └────┬────┘
         │ SÍ
         │
         ▼
    ┌──────────────┐
    │ Retornar     │
    │ Tipo Mapeado │
    └──────────────┘
         │
         │ NO
         ▼
┌─────────────────────────┐
│  Log Warning            │
│  + Retornar Fallback    │
│  "actividades"          │
└─────────────────────────┘
```

### Mapeos Disponibles

- `"exploración sensorial"` → `"actividades"`
- `"exploracion sensorial"` → `"actividades"`
- `"exploracion_sensorial"` → `"actividades"`
- `"sensory exploration"` → `"actividades"`
- `"arte"` → `"arte"`
- `"art"` → `"arte"`
- `"actividades"` → `"actividades"`
- `"activity"` → `"actividades"`

---

## Consideraciones de Rendimiento

1. **Operaciones Paralelas**: Airtable y WordPress se procesan en paralelo
2. **Logging No Bloqueante**: Los logs no bloquean la respuesta
3. **Sin Caché**: Cada consulta va directamente a Airtable
4. **Sin Retry**: No hay reintentos automáticos en caso de fallo

## Manejo de Errores en Flujos

- **Errores de Validación**: Retornan inmediatamente con código de error apropiado
- **Errores de Procesamiento**: Se capturan, registran en log, y se retorna error 500
- **Errores Parciales**: Si una operación falla pero la otra tiene éxito, se retorna éxito parcial



























