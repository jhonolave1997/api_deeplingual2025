# API Deeplingual 2025

API REST que actúa como intermediario entre agentes de IA que generan actividades pedagógicas y sistemas de almacenamiento y publicación (Airtable y WordPress).

## 🚀 Características

- ✅ **Almacenamiento en Airtable**: Guarda actividades pedagógicas con metadatos
- ✅ **Publicación en WordPress**: Crea posts automáticamente con campos ACF personalizados
- ✅ **Sistema de Logging**: Registra todos los eventos en Airtable para auditoría
- ✅ **Autenticación Bearer Token**: Seguridad mediante tokens
- ✅ **API RESTful**: Endpoints estándar para crear y consultar actividades
- ✅ **Manejo Robusto de Errores**: Logging detallado sin interrumpir el flujo principal

## 📋 Requisitos

- Node.js 14.x o superior
- Cuenta de Airtable con base de datos configurada
- WordPress con REST API habilitada
- JWT Token o método de autenticación para WordPress

## 🛠️ Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd api_deeplingual2025

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar (dependiendo de tu plataforma)
npm start
# o
vercel dev
```

## 📚 Documentación Completa

Toda la documentación está disponible en la carpeta [`docs/`](./docs/):

- **[README de Documentación](./docs/README.md)** - Índice general
- **[Arquitectura del Sistema](./docs/01-arquitectura.md)** - Componentes y diseño
- **[Documentación de API](./docs/02-api-endpoints.md)** - Referencia de endpoints
- **[Flujos de Proceso](./docs/03-flujos-proceso.md)** - Diagramas de flujo
- **[Guía de Configuración](./docs/04-configuracion.md)** - Instalación paso a paso
- **[Variables de Entorno](./docs/05-variables-entorno.md)** - Configuración de variables
- **[Diagramas de Secuencia](./docs/06-diagramas-secuencia.md)** - Secuencias detalladas

## 🔑 Variables de Entorno

Configura las siguientes variables en tu archivo `.env`:

```bash
API_TOKEN=tu_token_secreto
AIRTABLE_API_KEY=tu_api_key_de_airtable
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_TABLE_NAME=Pedagogical Outputs
AIRTABLE_LOGS_TABLE_NAME=Event Log
WP_URL=https://tu-wordpress.com
WP_JWT=tu_jwt_token
```

Ver [Variables de Entorno](./docs/05-variables-entorno.md) para detalles completos.

## 📡 Endpoints Principales

### Crear Actividad
```bash
POST /api/pedagogical-outputs
Authorization: Bearer <token>
Content-Type: application/json

{
  "run_id": "run_12345",
  "output_json": { ... },
  "needs_clarification": false
}
```

### Obtener por ID
```bash
GET /api/pedagogical-outputs/:id
Authorization: Bearer <token>
```

### Obtener Última
```bash
GET /api/pedagogical-outputs/latest
Authorization: Bearer <token>
```

Ver [Documentación de API](./docs/02-api-endpoints.md) para detalles completos.

## 🏗️ Estructura del Proyecto

```
api_deeplingual2025/
├── api/
│   ├── api_wp/
│   │   └── index.js          # Endpoint alternativo WordPress
│   └── pedagogical-outputs/
│       ├── index.js          # POST: Crear actividad
│       ├── [id].js           # GET: Obtener por ID
│       └── latest.js         # GET: Obtener última
├── docs/                     # Documentación completa
│   ├── README.md
│   ├── 01-arquitectura.md
│   ├── 02-api-endpoints.md
│   ├── 03-flujos-proceso.md
│   ├── 04-configuracion.md
│   ├── 05-variables-entorno.md
│   └── 06-diagramas-secuencia.md
├── logs/                     # Logs locales (opcional)
├── package.json
└── README.md
```

## 🔄 Flujo Principal

1. **Agente de IA** envía actividad pedagógica
2. **API valida** autenticación y datos
3. **Sistema guarda** en Airtable (paralelo)
4. **Sistema publica** en WordPress (paralelo)
5. **Sistema registra** eventos en logs
6. **API responde** con resultados

Ver [Flujos de Proceso](./docs/03-flujos-proceso.md) para diagramas detallados.

## 🔒 Seguridad

- ✅ Autenticación Bearer Token en todos los endpoints
- ✅ Validación estricta de estructura de datos
- ⚠️ Variables de entorno nunca en código
- ⚠️ HTTPS requerido en producción

## 🐛 Solución de Problemas

### Error: "Unauthorized"
- Verifica que el header `Authorization: Bearer <token>` esté presente
- Verifica que `API_TOKEN` en `.env` coincida

### Error: "Airtable error"
- Verifica `AIRTABLE_API_KEY` y `AIRTABLE_BASE_ID`
- Verifica que las tablas existan en Airtable

### Error: "WordPress error"
- Verifica `WP_URL` y `WP_JWT`
- Verifica que el custom post type `planessemanales` exista
- Verifica campos ACF configurados

Ver [Guía de Configuración](./docs/04-configuracion.md) para más detalles.

## 📦 Dependencias

- `airtable`: ^0.12.2 - Cliente de Airtable API

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura variables de entorno en el dashboard
3. Despliega

### Otras Plataformas

Asegúrate de:
- Configurar todas las variables de entorno
- Habilitar HTTPS
- Configurar rate limiting (recomendado)

## 📝 Licencia

[Especificar licencia]

## 👥 Contribuidores

[Especificar contribuidores]

## 📞 Soporte

[Especificar información de contacto o issues]

---

**Documentación completa**: Ver carpeta [`docs/`](./docs/)




























