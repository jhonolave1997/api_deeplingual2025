/**
 * GET /api/images/latest
 * 
 * Obtiene el último registro (output pedagógico) de CUALQUIER tipo:
 * - Actividades Curriculares (Pedagogical Outputs)
 * - Actividades Lógico-Matemáticas (Pedagogical Outputs Logic)
 * 
 * Retorna el más reciente basándose en la fecha de creación.
 * Este endpoint reemplaza:
 * - /api/pedagogical-outputs/latest
 * - /api/pedagogical-outputs-logic/latest
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
 * Determina el tipo de actividad y tabla basándose en el run_id
 */
function determineActivityType(runId) {
  if (!runId) return null;
  
  // Detectar prefijo
  if (runId.startsWith("deep-lingual-") || runId.startsWith("deeplingual-")) {
    return {
      type: "curriculum",
      table: TABLE_NAME,
      endpoint: "planessemanales"
    };
  }
  
  if (runId.startsWith("deepgraphic-") || runId.startsWith("deep-graphic-")) {
    return {
      type: "logic",
      table: TABLE_NAME, // Misma tabla, pero diferente endpoint en WP
      endpoint: "actividadlogicomatematica"
    };
  }
  
  // Por defecto, asumir curriculum
  return {
    type: "curriculum",
    table: TABLE_NAME,
    endpoint: "planessemanales"
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

  try {
    await appendUsageLog({
      level: "info",
      event: "latest_output_requested",
      run_id: "",
      message: "Solicitando último output (cualquier tipo)",
    });

    // Buscar el registro más reciente (ordenado por Created At desc)
    const records = await base(TABLE_NAME)
      .select({
        maxRecords: 1,
        sort: [{ field: "Created At", direction: "desc" }],
      })
      .firstPage();

    if (!records || records.length === 0) {
      await appendUsageLog({
        level: "warn",
        event: "latest_output_not_found",
        run_id: "",
        message: "No hay registros en Airtable",
      });

      return res.status(404).json({
        error: "No records found",
        message: "No hay outputs pedagógicos en la base de datos",
      });
    }

    const record = records[0];
    const runId = record.fields["Run ID"] || "";
    const activityType = determineActivityType(runId);

    const durationMs = Date.now() - startTime;

    await appendUsageLog({
      level: "info",
      event: "latest_output_retrieved",
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
          output: record.fields["Output JSON"]
            ? JSON.parse(record.fields["Output JSON"])
            : record.fields,
        },
      },
    });
  } catch (err) {
    console.error("❌ Error en /api/images/latest:", err);

    await appendUsageLog({
      level: "error",
      event: "latest_output_error",
      run_id: "",
      message: err?.message || "Unknown error",
      stack: err?.stack || "",
    });

    return res.status(500).json({
      error: "Internal server error",
      details: err?.message || String(err),
    });
  }
};





















