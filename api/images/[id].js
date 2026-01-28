/**
 * GET /api/images/:id
 * 
 * Obtiene un registro específico por su Run ID de CUALQUIER tipo:
 * - Actividades Curriculares (deep-lingual-*)
 * - Actividades Lógico-Matemáticas (deepgraphic-*)
 * 
 * El {id} es el Run ID (ej: deep-lingual-2025-01-19T10:00:00Z)
 * 
 * Este endpoint reemplaza:
 * - /api/pedagogical-outputs/:id
 * - /api/pedagogical-outputs-logic/:id
 */

const Airtable = require("airtable");

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Pedagogical Outputs";
const LOGS_TABLE_NAME = process.env.AIRTABLE_LOGS_TABLE_NAME || "Event Log";

/**
 * Logging a Airtable (Event Log)
 */
async function appendUsageLog(entry) {
  try {
    const payload = {
      "Event": entry.event || "unknown_event",
      "Level": entry.level || "info",
      "Run ID": entry.run_id || "",
      "Agent": entry.agent || "",
      "Duration Ms": entry.duration_ms ?? null,
      "Message": entry.message || "",
      "Stack": entry.stack || "",
      "Details JSON": entry.details ? JSON.stringify(entry.details) : "",
    };
    await base(LOGS_TABLE_NAME).create([{ fields: payload }]);
  } catch (e) {
    console.error("❌ Error guardando log:", e?.message || e);
  }
}

/**
 * Valida el token de autenticación
 */
function validateAuth(req) {
  const authHeader = req.headers?.authorization || "";
  const expectedToken = `Bearer ${process.env.API_TOKEN || ""}`;

  if (authHeader !== expectedToken) {
    return {
      ok: false,
      status: 401,
      payload: { error: "Unauthorized" },
    };
  }

  return { ok: true };
}

/**
 * Determina el tipo de actividad y configuración basándose en el run_id
 */
function determineActivityType(runId) {
  if (!runId) return null;
  
  // Detectar prefijo
  if (runId.startsWith("deep-lingual-") || runId.startsWith("deeplingual-")) {
    return {
      type: "curriculum",
      table: TABLE_NAME,
      endpoint: "planessemanales",
      default_fields: ["foto"]
    };
  }
  
  if (runId.startsWith("deepgraphic-") || runId.startsWith("deep-graphic-")) {
    return {
      type: "logic",
      table: TABLE_NAME,
      endpoint: "actividadlogicomatematica",
      default_fields: ["plantilla_es"]
    };
  }
  
  // Por defecto, asumir curriculum
  return {
    type: "curriculum",
    table: TABLE_NAME,
    endpoint: "planessemanales",
    default_fields: ["foto"]
  };
}

module.exports = async (req, res) => {
  const startTime = Date.now();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validar autenticación
  const auth = validateAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json(auth.payload);
  }

  // Obtener el ID de la ruta (Run ID)
  const runId = req.query.id || "";

  if (!runId) {
    return res.status(400).json({
      error: "Missing run_id",
      message: "Debes proporcionar un Run ID en la URL",
    });
  }

  try {
    await appendUsageLog({
      level: "info",
      event: "output_by_id_requested",
      run_id: runId,
      message: `Buscando output con Run ID: ${runId}`,
    });

    // Buscar el registro por Run ID
    const formula = `{Run ID} = '${runId.replace(/'/g, "\\'")}'`;
    
    const records = await base(TABLE_NAME)
      .select({
        filterByFormula: formula,
        maxRecords: 1,
      })
      .firstPage();

    if (!records || records.length === 0) {
      await appendUsageLog({
        level: "warn",
        event: "output_by_id_not_found",
        run_id: runId,
        message: `No se encontró registro con Run ID: ${runId}`,
      });

      return res.status(404).json({
        error: "Not found",
        message: `No se encontró ningún output con Run ID: ${runId}`,
        run_id: runId,
      });
    }

    const record = records[0];
    const activityType = determineActivityType(runId);
    const durationMs = Date.now() - startTime;

    await appendUsageLog({
      level: "info",
      event: "output_by_id_retrieved",
      run_id: runId,
      agent: activityType.type,
      duration_ms: durationMs,
      details: {
        airtable_record_id: record.id,
        wp_post_id: record.fields["WP Post ID"] || null,
        activity_type: activityType.type,
        wp_endpoint: activityType.endpoint,
      },
    });

    // Formato de respuesta compatible con el schema OpenAPI
    return res.status(200).json({
      data: {
        id: record.id,
        attributes: {
          run_id: runId,
          created_at: record.fields["Created At"] || new Date().toISOString(),
          wp_post_id: record.fields["WP Post ID"] || null,
          activity_type: activityType.type,
          wp_endpoint: activityType.endpoint,
          default_fields: activityType.default_fields,
          output: record.fields["Output JSON"]
            ? JSON.parse(record.fields["Output JSON"])
            : record.fields,
        },
      },
    });
  } catch (err) {
    console.error(`❌ Error en /api/images/${runId}:`, err);

    await appendUsageLog({
      level: "error",
      event: "output_by_id_error",
      run_id: runId,
      message: err?.message || "Unknown error",
      stack: err?.stack || "",
    });

    return res.status(500).json({
      error: "Internal server error",
      details: err?.message || String(err),
      run_id: runId,
    });
  }
};





















