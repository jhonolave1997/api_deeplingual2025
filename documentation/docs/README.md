# Documentación del Proyecto API Deeplingual 2025

Bienvenido a la documentación completa del proyecto API Deeplingual 2025. Esta documentación proporciona toda la información necesaria para entender, configurar, usar y mantener el sistema.

## 📚 Índice de Documentación

### Documentos Principales

1. **[README Principal](../README.md)** - Visión general del proyecto
2. **[Arquitectura del Sistema](./01-arquitectura.md)** - Descripción de la arquitectura y componentes
3. **[Documentación de API](./02-api-endpoints.md)** - Referencia completa de endpoints
4. **[Flujos de Proceso](./03-flujos-proceso.md)** - Diagramas y descripciones de flujos
5. **[Configuración](./04-configuracion.md)** - Guía de instalación y configuración
6. **[Variables de Entorno](./05-variables-entorno.md)** - Documentación de variables de entorno
7. **[Diagramas de Secuencia](./06-diagramas-secuencia.md)** - Diagramas de secuencia de los procesos principales

### Guías Rápidas

- **Inicio Rápido**: Ver [Configuración](./04-configuracion.md)
- **Uso de la API**: Ver [Documentación de API](./02-api-endpoints.md)
- **Entender el Flujo**: Ver [Flujos de Proceso](./03-flujos-proceso.md)

## 🎯 Propósito del Proyecto

Este proyecto es una API REST que actúa como intermediario entre agentes de IA que generan actividades pedagógicas y sistemas de almacenamiento y publicación:

- **Almacenamiento**: Guarda actividades en Airtable
- **Publicación**: Crea posts en WordPress con formato personalizado
- **Logging**: Registra todos los eventos en Airtable para auditoría
- **Consulta**: Permite recuperar actividades por ID o la última actividad creada

## 🏗️ Componentes Principales

1. **API Endpoints** (`/api/pedagogical-outputs`)
   - POST: Crear nueva actividad
   - GET /:id: Obtener actividad por Run ID
   - GET /latest: Obtener última actividad

2. **Integración con WordPress** (`/api/api_wp`)
   - Endpoint alternativo para publicación directa en WordPress

3. **Sistema de Logging**
   - Registro de eventos en Airtable (tabla "Event Log")
   - Logging opcional a archivo

## 📖 Cómo Usar Esta Documentación

1. **Nuevos Desarrolladores**: Comienza con [Arquitectura](./01-arquitectura.md) y [Configuración](./04-configuracion.md)
2. **Integración**: Revisa [Documentación de API](./02-api-endpoints.md) y [Diagramas de Secuencia](./06-diagramas-secuencia.md)
3. **Mantenimiento**: Consulta [Flujos de Proceso](./03-flujos-proceso.md) para entender el comportamiento del sistema

## 🔗 Enlaces Útiles

- Repositorio del proyecto
- Documentación de Airtable API
- Documentación de WordPress REST API
- Documentación de Vercel (si aplica)

---

**Última actualización**: 2025



























