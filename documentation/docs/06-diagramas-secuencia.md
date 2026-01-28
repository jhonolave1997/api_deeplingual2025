# Diagramas de Secuencia

Este documento contiene diagramas de secuencia detallados de los procesos principales del sistema.

## 1. Secuencia: Creación de Actividad Pedagógica

```
Agente IA          API              Airtable         WordPress        Event Log
   │                │                  │                 │                │
   │  POST /api/    │                 │                 │                │
   │  pedagogical-  │                 │                 │                │
   │  outputs       │                 │                 │                │
   ├───────────────>│                 │                 │                │
   │                │                 │                 │                │
   │                │ Validar Método  │                 │                │
   │                │ Validar Auth    │                 │                │
   │                │ Validar Body    │                 │                │
   │                │                 │                 │                │
   │                │ Log: request_   │                 │                │
   │                │ received        │                 │                │
   │                ├───────────────────────────────────────────────────>│
   │                │                 │                 │                │
   │                │ Guardar Record  │                 │                │
   │                ├────────────────>│                 │                │
   │                │                 │                 │                │
   │                │                 │ Record Created  │                │
   │                │<────────────────┤                 │                │
   │                │                 │                 │                │
   │                │ Crear Post WP   │                 │                │
   │                │                 ├─────────────────>│                │
   │                │                 │                 │                │
   │                │                 │                 │ Post Created   │
   │                │                 │<─────────────────┤                │
   │                │                 │                 │                │
   │                │ Log: process_   │                 │                │
   │                │ completed       │                 │                │
   │                ├───────────────────────────────────────────────────>│
   │                │                 │                 │                │
   │                │ 201 Created    │                 │                │
   │<───────────────┤                 │                 │                │
   │                │                 │                 │                │
```

### Descripción Detallada

1. **Agente envía POST**: Incluye Bearer Token y body con actividad
2. **API valida**: Método HTTP, autenticación, y estructura del body
3. **Log inicial**: Se registra `request_received` en Event Log (Airtable)
4. **Guardado en Airtable**: Se crea registro en tabla "Pedagogical Outputs"
5. **Publicación en WordPress**: Se crea post en custom post type (paralelo o secuencial)
6. **Log final**: Se registra `process_completed` con resultados
7. **Respuesta**: Se retorna 201 con resultados de ambas operaciones

### Notas

- Las operaciones de Airtable y WordPress pueden ejecutarse en paralelo
- Si una falla, la otra puede continuar
- Los logs no bloquean la respuesta

---

## 2. Secuencia: Consulta de Actividad por ID

```
Cliente          API              Airtable         Event Log
   │              │                  │                │
   │  GET /api/   │                 │                 │
   │  pedagogical-│                 │                 │
   │  outputs/:id  │                 │                 │
   ├──────────────>│                 │                 │
   │              │                 │                 │
   │              │ Validar Método  │                 │
   │              │ Validar Auth    │                 │
   │              │ Extraer Run ID  │                 │
   │              │                 │                 │
   │              │ Log: get_       │                 │
   │              │ request_received│                 │
   │              ├──────────────────────────────────>│
   │              │                 │                 │
   │              │ Buscar por      │                 │
   │              │ Run ID          │                 │
   │              ├─────────────────>│                 │
   │              │                 │                 │
   │              │                 │ Query Results   │
   │              │<────────────────┤                 │
   │              │                 │                 │
   │              │ Parsear JSON    │                 │
   │              │                 │                 │
   │              │ Log: record_    │                 │
   │              │ fetched_success │                 │
   │              ├───────────────────────────────────>│
   │              │                 │                 │
   │              │ 200 OK          │                 │
   │<─────────────┤                 │                 │
   │              │                 │                 │
```

### Variante: Registro No Encontrado

```
Cliente          API              Airtable         Event Log
   │              │                  │                │
   │  GET /:id    │                 │                 │
   ├──────────────>│                 │                 │
   │              │                 │                 │
   │              │ Buscar por      │                 │
   │              │ Run ID          │                 │
   │              ├─────────────────>│                 │
   │              │                 │                 │
   │              │                 │ Empty Results   │
   │              │<────────────────┤                 │
   │              │                 │                 │
   │              │ Log: record_    │                 │
   │              │ not_found       │                 │
   │              ├───────────────────────────────────>│
   │              │                 │                 │
   │              │ 404 Not Found   │                 │
   │<─────────────┤                 │                 │
   │              │                 │                 │
```

---

## 3. Secuencia: Consulta de Última Actividad

```
Cliente          API              Airtable         Event Log
   │              │                  │                │
   │  GET /latest  │                 │                 │
   ├──────────────>│                 │                 │
   │              │                 │                 │
   │              │ Validar Método   │                 │
   │              │ Validar Auth     │                 │
   │              │                 │                 │
   │              │ Log: latest_     │                 │
   │              │ request_received │                 │
   │              ├───────────────────────────────────>│
   │              │                 │                 │
   │              │ Query: Sort by   │                 │
   │              │ Created At DESC │                 │
   │              │ Limit 1         │                 │
   │              ├─────────────────>│                 │
   │              │                 │                 │
   │              │                 │ Latest Record   │
   │              │<────────────────┤                 │
   │              │                 │                 │
   │              │ Parsear JSON    │                 │
   │              │                 │                 │
   │              │ Log: latest_    │                 │
   │              │ fetched_success │                 │
   │              ├───────────────────────────────────>│
   │              │                 │                 │
   │              │ 200 OK          │                 │
   │<─────────────┤                 │                 │
   │              │                 │                 │
```

---

## 4. Secuencia: Manejo de Errores

### Error de Autenticación

```
Cliente          API              Event Log
   │              │                 │
   │  POST /api/  │                 │
   │  (sin token) │                 │
   ├──────────────>│                 │
   │              │                 │
   │              │ Validar Auth    │
   │              │ ❌ Token faltante│                 │
   │              │                 │
   │              │ Log: missing_  │                 │
   │              │ bearer_token    │                 │
   │              ├─────────────────>│
   │              │                 │
   │              │ 401 Unauthorized│                 │
   │<─────────────┤                 │
   │              │                 │
```

### Error en Airtable

```
Agente          API              Airtable         WordPress        Event Log
   │              │                  │                 │                │
   │  POST        │                 │                 │                │
   ├──────────────>│                 │                 │                │
   │              │                 │                 │                │
   │              │ Guardar Record  │                 │                │
   │              ├─────────────────>│                 │                │
   │              │                 │                 │                │
   │              │                 │ ❌ Error         │                │
   │              │<────────────────┤                 │                │
   │              │                 │                 │                │
   │              │ Crear Post WP   │                 │                │
   │              │                 ├─────────────────>│                │
   │              │                 │                 │                │
   │              │                 │                 │ ✅ Post Created │
   │              │                 │<─────────────────┤                │
   │              │                 │                 │                │
   │              │ Log: process_   │                 │                │
   │              │ completed       │                 │                │
   │              │ (airtable: fail)│                 │                │
   │              ├───────────────────────────────────────────────────>│
   │              │                 │                 │                │
   │              │ 201 Created     │                 │                │
   │              │ (partial)      │                 │                │
   │<─────────────┤                 │                 │                │
   │              │                 │                 │                │
```

### Error General (Excepción)

```
Agente          API              Event Log
   │              │                 │
   │  POST        │                 │
   ├──────────────>│                 │
   │              │                 │
   │              │ Procesar...     │                 │
   │              │                 │                 │
   │              │ ❌ Exception     │                 │
   │              │                 │                 │
   │              │ Log: unhandled_ │                 │
   │              │ exception       │                 │
   │              │ (con stack)     │                 │
   │              ├─────────────────>│
   │              │                 │
   │              │ 500 Internal    │                 │
   │              │ Server Error    │                 │
   │<─────────────┤                 │
   │              │                 │
```

---

## 5. Secuencia: Sistema de Logging

```
Proceso          Logger           Airtable         Archivo
   │              │                 │                │
   │  Evento      │                 │                │
   │  ocurre      │                 │                │
   ├──────────────>│                 │                │
   │              │                 │                │
   │              │ Construir Entry│                 │
   │              │                 │                 │
   │              │ Promise.        │                 │
   │              │ allSettled([    │                 │
   │              │   Log Airtable,│                 │
   │              │   Log Archivo   │                 │
   │              │ ])             │                 │
   │              │                 │                 │
   │              │ Create Record  │                 │
   │              ├────────────────>│                 │
   │              │                 │                 │
   │              │ Write File     │                 │
   │              │                 ├─────────────────>│
   │              │                 │                 │
   │              │                 │ ✅/❌           │
   │              │                 │<────────────────┤
   │              │                 │                 │
   │              │ ✅/❌            │                 │
   │              │<────────────────┤                 │
   │              │                 │                 │
   │              │ Continuar       │                 │
   │              │ (no bloquea)    │                 │
   │              │                 │                 │
```

### Notas sobre Logging

- Los logs se escriben de forma no bloqueante
- Si falla el logging, el proceso principal continúa
- Se usan `Promise.allSettled` para no fallar si un logger falla
- Los errores de logging se registran en consola pero no afectan la respuesta

---

## 6. Secuencia: Validación y Normalización

```
Agente          API              Normalizador
   │              │                 │
   │  POST con    │                 │
   │  tipo_de_    │                 │
   │  actividad   │                 │
   ├──────────────>│                 │
   │              │                 │
   │              │ Extraer tipo    │                 │
   │              │ de actividad    │                 │
   │              ├─────────────────>│
   │              │                 │
   │              │ Normalizar      │                 │
   │              │ (lowercase,     │                 │
   │              │  trim, remove   │                 │
   │              │  accents)      │                 │
   │              │                 │
   │              │ Buscar en mapa  │                 │
   │              │                 │
   │              │ Tipo mapeado    │                 │
   │              │<────────────────┤
   │              │                 │
   │              │ Usar tipo       │                 │
   │              │ mapeado        │                 │
   │              │                 │
```

---

## Tiempos Típicos

Basado en operaciones normales (pueden variar):

- **Validación**: < 10ms
- **Logging a Airtable**: 100-500ms
- **Guardado en Airtable**: 200-800ms
- **Publicación en WordPress**: 300-1000ms
- **Total (creación)**: 500-2000ms
- **Consulta en Airtable**: 100-500ms
- **Total (consulta)**: 200-600ms

## Consideraciones de Rendimiento

1. **Operaciones Paralelas**: Airtable y WordPress pueden procesarse en paralelo
2. **Logging Asíncrono**: Los logs no bloquean la respuesta
3. **Sin Caché**: Cada consulta va directamente a Airtable
4. **Sin Retry**: No hay reintentos automáticos

## Mejoras Futuras

1. **Queue System**: Para procesar actividades de forma asíncrona
2. **Retry Logic**: Reintentos automáticos en caso de fallo
3. **Caching**: Cachear consultas frecuentes
4. **Rate Limiting**: Limitar peticiones por cliente
5. **Batch Operations**: Procesar múltiples actividades a la vez



























