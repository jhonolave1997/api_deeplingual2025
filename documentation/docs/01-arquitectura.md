# Arquitectura del Sistema

## Visión General

La API Deeplingual 2025 es un sistema de intermediación que procesa actividades pedagógicas generadas por agentes de IA y las distribuye a sistemas de almacenamiento y publicación.

## Diagrama de Arquitectura

```
┌─────────────────┐
│  Agente de IA   │
│  (Generador)    │
└────────┬────────┘
         │
         │ POST /api/pedagogical-outputs
         │ (Bearer Token)
         ▼
┌─────────────────────────────────────┐
│      API Deeplingual 2025           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Validación y Autenticación   │  │
│  └──────────────┬────────────────┘  │
│                 │                    │
│  ┌──────────────▼────────────────┐  │
│  │  Procesamiento de Datos       │  │
│  │  - Normalización              │  │
│  │  - Mapeo de tipos             │  │
│  │  - Construcción ACF           │  │
│  └──────────────┬────────────────┘  │
│                 │                    │
│  ┌──────────────▼────────────────┐  │
│  │  Sistema de Logging           │  │
│  │  - Event Log (Airtable)       │  │
│  │  - Archivo (opcional)         │  │
│  └───────────────────────────────┘  │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│  Airtable   │  │  WordPress   │
│  (Storage)  │  │  (Publish)   │
└─────────────┘  └──────────────┘
```

## Componentes del Sistema

### 1. API Endpoints

#### `/api/pedagogical-outputs`
**Archivo**: `api/pedagogical-outputs/index.js`

**Responsabilidades**:
- Recibir actividades pedagógicas desde agentes
- Validar autenticación (Bearer Token)
- Validar estructura de datos
- Guardar en Airtable
- Publicar en WordPress
- Registrar eventos en sistema de logging

#### `/api/pedagogical-outputs/[id].js`
**Archivo**: `api/pedagogical-outputs/[id].js`

**Responsabilidades**:
- Obtener actividad específica por Run ID
- Validar autenticación
- Consultar Airtable
- Registrar consultas en logging

#### `/api/pedagogical-outputs/latest.js`
**Archivo**: `api/pedagogical-outputs/latest.js`

**Responsabilidades**:
- Obtener la última actividad creada
- Ordenar por fecha de creación descendente
- Registrar consultas en logging

#### `/api/api_wp`
**Archivo**: `api/api_wp/index.js`

**Responsabilidades**:
- Endpoint alternativo para publicación directa en WordPress
- Validación simplificada
- Publicación inmediata (status: publish)

### 2. Sistema de Almacenamiento

#### Airtable
- **Tabla Principal**: "Pedagogical Outputs"
  - Campos: Run ID, Output JSON, Needs Clarification, Created At, Updated At
- **Tabla de Logs**: "Event Log"
  - Campos: Event, Level, Run ID, Agent, Duration Ms, Message, Stack, Details JSON

#### WordPress
- **Custom Post Type**: `planessemanales`
- **Campos ACF**:
  - `instrucciones`
  - `materiales`
  - `materiales_reciclables`
  - `objetivos`
  - `pasos`
  - `tips`
  - `instrucciones_de_evaluacion`

### 3. Sistema de Autenticación

**Método**: Bearer Token
- Header requerido: `Authorization: Bearer <token>`
- Token validado contra variable de entorno: `API_TOKEN`
- Respuestas de error: 401 Unauthorized

### 4. Sistema de Logging

#### Logging a Airtable
- Tabla: "Event Log"
- Eventos registrados:
  - `request_received`: Solicitud recibida
  - `process_completed`: Proceso completado
  - `invalid_body`: Body inválido
  - `unhandled_exception`: Excepción no manejada
  - `get_request_received`: Consulta GET recibida
  - `record_fetched_success`: Registro obtenido exitosamente
  - `record_not_found`: Registro no encontrado
  - `latest_request_received`: Solicitud de último registro
  - `latest_fetched_success`: Último registro obtenido

#### Logging a Archivo (Opcional)
- Directorio: `/tmp/logs` (Vercel-safe)
- Archivo: `agent-usage.log`
- Formato: JSON Lines (una línea por evento)

## Flujo de Datos

### Flujo Principal: Creación de Actividad

1. **Recepción**: Agente envía POST con actividad
2. **Validación**: Verificación de token y estructura
3. **Logging Inicial**: Registro de recepción
4. **Procesamiento Paralelo**:
   - Guardado en Airtable
   - Publicación en WordPress
5. **Logging Final**: Registro de resultados
6. **Respuesta**: Retorno de estado de ambas operaciones

### Flujo de Consulta: Obtener Actividad

1. **Recepción**: Cliente envía GET con Run ID
2. **Validación**: Verificación de token
3. **Logging Inicial**: Registro de consulta
4. **Consulta**: Búsqueda en Airtable por Run ID
5. **Procesamiento**: Parseo de JSON almacenado
6. **Logging Final**: Registro de resultado
7. **Respuesta**: Retorno de datos o error 404

## Tecnologías Utilizadas

- **Runtime**: Node.js
- **Base de Datos**: Airtable (API)
- **CMS**: WordPress (REST API)
- **Autenticación**: Bearer Token
- **Dependencias**:
  - `airtable`: ^0.12.2

## Patrones de Diseño

### 1. Validación Separada
- Funciones dedicadas para validación de autenticación y body
- Retorno estructurado: `{ ok: boolean, status?: number, payload?: object }`

### 2. Manejo de Errores Robusto
- Try-catch en todas las operaciones asíncronas
- Logging de errores sin interrumpir flujo principal
- Respuestas de error estructuradas

### 3. Logging No Bloqueante
- `Promise.allSettled` para logging paralelo
- Errores de logging no afectan respuesta principal

### 4. Normalización de Datos
- Mapeo de tipos de actividad
- Normalización de texto (acentos, espacios)
- Construcción de campos ACF desde output_json

## Consideraciones de Escalabilidad

1. **Rate Limiting**: No implementado actualmente
2. **Caching**: No implementado
3. **Queue System**: No implementado (operaciones síncronas)
4. **Retry Logic**: No implementado para fallos de WordPress/Airtable

## Seguridad

1. **Autenticación**: Bearer Token requerido en todos los endpoints
2. **Validación**: Validación estricta de estructura de datos
3. **Sanitización**: No implementada (depende de WordPress)
4. **HTTPS**: Requerido en producción

## Limitaciones Actuales

1. Operaciones síncronas (no hay cola de procesamiento)
2. Sin retry automático en caso de fallos
3. Sin rate limiting
4. Sin validación de contenido (solo estructura)
5. Sin versionado de API



























