const Airtable = require("airtable");
const { makeAuthenticatedRequest } = require("../../utils/wp-auth");

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

const TABLE_NAME =
  process.env.AIRTABLE_TABLE_NAME || "Pedagogical Outputs";

//  nueva tabla para logs
const LOGS_TABLE_NAME =
  process.env.AIRTABLE_LOGS_TABLE_NAME || "Event Log";

/**
 * =========================
 *  MAPEO TIPO DE ACTIVIDAD
 * =========================
 */
const ACF_ALLOWED_KEYS = new Set([
  "tema",
  "descripcion",
  "objetivos",
  "instrucciones",
  "framework",
  "tipo_razonamiento",
  "competencia_cognitiva",
  "nivel_dificultad",
  "grupo_de_edad",
  "estimulo",
  "pasos",
  "tips",
  "criteria",
  "promt_visual",
  "dia_especifico",
  "respuesta_correcta",
  "opciones_respuesta",
  "requiere_plantilla",
  "momento_de_aprendizaje",
  "elof",
  "dominios_uc",
  "enfoque_general",
  "enfoque_pedagojico",
  "curriculum",
  "mes",
  "language",
  "tiempo_en_minutos",
  "observaciones"
]);

/**
 * Procesa los campos ACF de relación, convirtiendo strings a IDs cuando sea necesario
 */
function processAcfFields(acfData = {}) {
  const processed = { ...acfData };
  
  // Campos que requieren conversión de string a ID usando ID_MAP
  if (processed.curriculum !== undefined) {
    // Si ya es un array de números, mantenerlo; si es string/array de strings, convertir
    const isNumericArray = Array.isArray(processed.curriculum) && 
      processed.curriculum.every(v => typeof v === 'number');
    if (!isNumericArray) {
      processed.curriculum = toIdList(ID_MAP.curriculum, processed.curriculum);
    }
  }
  
  if (processed.momento_de_aprendizaje !== undefined) {
    const isNumericArray = Array.isArray(processed.momento_de_aprendizaje) && 
      processed.momento_de_aprendizaje.every(v => typeof v === 'number');
    if (!isNumericArray) {
      processed.momento_de_aprendizaje = toIdList(ID_MAP.momento, processed.momento_de_aprendizaje);
    }
  }
  
  if (processed.elof !== undefined) {
    const isNumericArray = Array.isArray(processed.elof) && 
      processed.elof.every(v => typeof v === 'number');
    if (!isNumericArray) {
      processed.elof = toIdList(ID_MAP.elof, processed.elof);
    }
  }
  
  if (processed.dominios_uc !== undefined) {
    const isNumericArray = Array.isArray(processed.dominios_uc) && 
      processed.dominios_uc.every(v => typeof v === 'number');
    if (!isNumericArray) {
      processed.dominios_uc = toIdList(ID_MAP.dominio_uc, processed.dominios_uc);
    }
  }
  
  if (processed.grupo_de_edad !== undefined) {
    const isNumericArray = Array.isArray(processed.grupo_de_edad) && 
      processed.grupo_de_edad.every(v => typeof v === 'number');
    if (!isNumericArray) {
      processed.grupo_de_edad = toIdList(ID_MAP.edad, processed.grupo_de_edad);
    }
  }
  
  if (processed.enfoque_general !== undefined) {
    const isNumericArray = Array.isArray(processed.enfoque_general) && 
      processed.enfoque_general.every(v => typeof v === 'number');
    if (!isNumericArray) {
      // enfoque_general usa el mismo mapeo que enfoque (enfoques pedagógicos)
      processed.enfoque_general = toIdList(ID_MAP.enfoque || {}, processed.enfoque_general);
    }
  }
  
  // Campo que es array de strings (no requiere conversión a ID)
  if (processed.enfoque_pedagojico !== undefined) {
    processed.enfoque_pedagojico = toStringList(processed.enfoque_pedagojico);
  }
  
  return processed;
}

/**
 * Normaliza la estructura de output_json para que siempre tenga { title, status, content, acf: {...} }
 * Soporta dos formatos:
 * 1. Nuevo: campos ACF directamente en output_json
 * 2. Antiguo: campos ACF dentro de output_json.acf
 */
function normalizeOutputJson(outputJson = {}) {
  // Detectar si los campos ACF están directamente en output_json o dentro de output_json.acf
  const hasAcfObject = outputJson.acf && typeof outputJson.acf === 'object' && Object.keys(outputJson.acf).length > 0;
  const hasDirectAcfFields = Object.keys(outputJson).some(k => ACF_ALLOWED_KEYS.has(k));
  
  let acfData = {};
  
  if (hasAcfObject) {
    // Estructura antigua: output_json.acf existe
    acfData = { ...outputJson.acf };
  } else if (hasDirectAcfFields) {
    // Estructura nueva: campos ACF directamente en output_json
    // Extraer solo los campos ACF permitidos
    for (const key of ACF_ALLOWED_KEYS) {
      if (key in outputJson) {
        acfData[key] = outputJson[key];
      }
    }
  }
  
  // Procesar campos de relación (convertir strings a IDs si es necesario)
  acfData = processAcfFields(acfData);
  
  // Construir el objeto normalizado
  const normalized = {
    title: outputJson.title || '',
    status: outputJson.status || 'draft',
    content: outputJson.content || '',
    acf: acfData
  };
  
  // Mantener otros campos no-ACF si existen (como slug)
  if (outputJson.slug) {
    normalized.slug = outputJson.slug;
  }
  
  return normalized;
}

function sanitizeAcf(acf = {}) {
  const clean = {};
  const enfoqueGeneral = acf.enfoque_general; // Guardar para procesar después
  
  for (const [k, v] of Object.entries(acf)) {
    if (ACF_ALLOWED_KEYS.has(k)) {
      // Temporalmente excluir enfoque_general del payload ACF principal
      // Se procesará después usando update_field directamente
      if (k === 'enfoque_general') {
        continue; // Omitir este campo por ahora
      }
      clean[k] = v;
  }
  }
  
  // Guardar enfoque_general para procesarlo después (usando una clave temporal)
  if (enfoqueGeneral !== undefined) {
    clean._enfoque_general_temp = enfoqueGeneral;
  }
  
  // Asegurar que enfoque_general no esté presente
  delete clean.enfoque_general;
  
  return clean;
}




function normalizeKey(value = "") {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}




function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function toStringList(raw) {
  return toArray(raw).map(v => String(v).trim()).filter(Boolean);
}


/**
 * =========================
 *  LOGGING A AIRTABLE
 * =========================
 * Guarda logs antiguos + nuevos (cada log es un record).
 */
async function appendUsageLog(entry) {
  try {
    // Normalizamos entrada
    const payload = {
      "Event": entry.event || "unknown_event",
      "Level": entry.level || "info",
      "Run ID": entry.run_id || "",
      "Agent": entry.agent || "",
      "Duration Ms": entry.duration_ms ?? null,
      "Message": entry.message || "",
      "Stack": entry.stack || "",
      "Details JSON": entry.details
        ? JSON.stringify(entry.details)
        : entry.details_json
        ? JSON.stringify(entry.details_json)
        : "",

    };

    await base(LOGS_TABLE_NAME).create([{ fields: payload }]);
  } catch (e) {
    // Si falla el logger NO rompemos el flujo principal
    console.error(" Error guardando log en Airtable:", e?.message || e);
  }
}

/**
 * Valida body mínimo.
 */
function validateBody(data) {
  const okBase =
    data && data.run_id && data.output_json && typeof data.needs_clarification === "boolean";

  if (!okBase) { 
    return {
      ok: false,
      status: 400,
      payload: {
        error: "Bad Request",
        message: "Body must include run_id, output_json, and needs_clarification (boolean)."
      }
    };
  }

  // Validación mínima del nuevo esquema (si no es "needs_clarification")
  if (!data.needs_clarification) {
    // Validar que tenga title, status y content
    const hasBasicFields =
      typeof data.output_json?.title === "string" &&
      typeof data.output_json?.status === "string" &&
      typeof data.output_json?.content === "string";
    
    // Validar que tenga campos ACF (pueden estar en output_json.acf o directamente en output_json)
    const hasAcfObject = typeof data.output_json?.acf === "object" && data.output_json.acf !== null;
    const hasDirectAcfFields = Object.keys(data.output_json || {}).some(k => ACF_ALLOWED_KEYS.has(k));
    const hasAcfData = hasAcfObject || hasDirectAcfFields;

    if (!hasBasicFields || !hasAcfData) {
      return {
        ok: false,
        status: 400,
        payload: {
          error: "Bad Request",
          message: "output_json must include title, status, content, and ACF fields (either in output_json.acf or directly in output_json) when needs_clarification=false"
        }
      };
    }
  }

  return { ok: true };
}


/**
 * Verifica Bearer token.
 */
function validateAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      payload: {
        error: "Unauthorized: Bearer token required",
      },
    };
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.API_TOKEN) {
    return {
      ok: false,
      status: 401,
      payload: {
        error: "Unauthorized: Invalid token",
      },
    };
  }

  return { ok: true };
}

/**
 * Guarda actividad en Airtable.
 */
async function saveToAirtable(data) {
  try {
    const record = await base(TABLE_NAME).create([
      {
        fields: {
          "Run ID": data.run_id,
          "Output JSON": JSON.stringify(data.output_json),
          "Needs Clarification": data.needs_clarification,
        },
      },
    ]);

    const created = record[0];

    console.log(" Guardado en Airtable:", created.id);

    return {
      success: true,
      record: {
        id: created.id,
        run_id: data.run_id,
        output_json: data.output_json,
        needs_clarification: data.needs_clarification,
        createdAt: created.fields["Created At"],
        
      },
    };
  } catch (err) {
    console.error("Error guardando en Airtable:", err);
    return {
      success: false,
      error: err?.message || "Airtable error",
    };
  }
}

async function updateAirtableWithWpPostId(airtableRecordId, wpPostId) {
  if (!airtableRecordId || !wpPostId) return;

  await base(TABLE_NAME).update([
    {
      id: airtableRecordId,
      fields: {
        "WP Post ID": Number(wpPostId),
      },
    },
  ]);
}


function normalizeLookupKey(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/&/g, "y")
    .replace(/[^a-z0-9\s-]/g, "") // quita signos raros
    .replace(/\s+/g, " ")
    .trim();
}

const ID_MAP = {
  curriculum: {
    [normalizeLookupKey("After Schoolers Summer Edition")]: 96224,
    [normalizeLookupKey("Basico")]: 79,
    [normalizeLookupKey("Homeschooling")]: 5828,
    [normalizeLookupKey("Infantes")]: 647,
    [normalizeLookupKey("Intermedio")]: 194,
    [normalizeLookupKey("3K")]: 195,
  },
  enfoque: {
    [normalizeLookupKey("María montessori")]: 201,
    [normalizeLookupKey("Pedagogía")]: 202,
    [normalizeLookupKey("Pikleriana")]: 203,
    [normalizeLookupKey("Reggio Emilia")]: 204,
    [normalizeLookupKey("Tradicional")]: 205,
    [normalizeLookupKey("Waldorf")]: 206,
  },
  momento: {
      [normalizeLookupKey("Actividad de Estimulación")]: 6024,
      [normalizeLookupKey("Actividades al aire libre")]: 815,
      [normalizeLookupKey("Actividades de la tarde")]: 810,
      [normalizeLookupKey("Adivinanza")]: 9498,
      [normalizeLookupKey("Agua y arena")]: 8616,

      // ⚠️ Duplicado en PDF: "Almuerzo" aparece con 2 IDs.
      // Elegimos 812 (serie 8xx consistente con otros momentos base).
      [normalizeLookupKey("Almuerzo")]: 812,
      // [normalizeLookupKey("Almuerzo")]: 5722, // duplicado (PDF)

      [normalizeLookupKey("Arte y escritura")]: 7897,
      [normalizeLookupKey("Arte y manualidades")]: 6701,
      [normalizeLookupKey("Bloque y construcción")]: 6543,
      [normalizeLookupKey("Canción semanal")]: 7432,

      // ⚠️ Duplicado en PDF: "Ciencia y descubrimiento" aparece con 2 IDs.
      // Elegimos 27972 (coherente con Waldorf 27992, Lógica 27959, etc.)
      [normalizeLookupKey("Ciencia y descubrimiento")]: 27972,
      // [normalizeLookupKey("Ciencia y descubrimiento")]: 8160, // duplicado (PDF)

      [normalizeLookupKey("Cocina")]: 8107,
      [normalizeLookupKey("Creatividad")]: 30867,
      [normalizeLookupKey("Despedida")]: 816,
      [normalizeLookupKey("Eleccion Libre Actividades Matutinas")]: 92255,
      [normalizeLookupKey("Emocional")]: 8593,
      [normalizeLookupKey("Exploración y descubrimiento")]: 96502,
      [normalizeLookupKey("Habilidades corporales")]: 42651,
      [normalizeLookupKey("Juegos de representación")]: 6582,
      [normalizeLookupKey("Lavado de manos")]: 12700,
      [normalizeLookupKey("Lenguaje de señas")]: 100051,
      [normalizeLookupKey("Lenguaje y comunicación")]: 6870,
      [normalizeLookupKey("Lógica y memoria")]: 27959,
      [normalizeLookupKey("Matemáticas")]: 6884,

      // En el PDF existen ambos:
      [normalizeLookupKey("Mañana de cuentos")]: 92266,
      [normalizeLookupKey("Story Time")]: 814,

      [normalizeLookupKey("Montessori")]: 6611,
      [normalizeLookupKey("Musica y movimiento")]: 811,
      [normalizeLookupKey("Reggio Emilia")]: 11701,
      [normalizeLookupKey("Reunión matutina")]: 5878,
      [normalizeLookupKey("Sensorial")]: 6539,
      [normalizeLookupKey("Siesta")]: 813,
      [normalizeLookupKey("Snack")]: 5721,
      [normalizeLookupKey("Tiempo de Circulo")]: 808,
      [normalizeLookupKey("Transiciones")]: 817,
      [normalizeLookupKey("Waldorf")]: 27992,

      // -------------------------------------------------------
      // Estos NO aparecen como título exacto en el PDF (según extracción),
      // pero los dejo comentados para que los agregues si confirmas IDs:
      // [normalizeLookupKey("Experimento")]: null,
      // [normalizeLookupKey("Grandes movimientos")]: null,
      // [normalizeLookupKey("Juego libre")]: null,
      // [normalizeLookupKey("Juegos de mesa")]: null,

      // Extra en PDF (por si también lo quieres soportar)
      [normalizeLookupKey("Juego al aire libre")]: 92267,
      [normalizeLookupKey("Grupo pequeño de la tarde")]: 92268,
      [normalizeLookupKey("Grupo Pequeño Matutino")]: 92255, // (mismo ID del bloque matutino)
      // =======================================================
      // ✅ Aliases útiles (entrada del agente -> título real en WP)
      // =======================================================

      // Si el agente manda "emocional" en minúscula, normalizeLookupKey ya lo arregla,
      // pero si manda sin tildes / variantes, ayuda:

      [normalizeLookupKey("story time")]:814,
      [normalizeLookupKey("tiempo de circulo")]:808,
      // Variantes "actividades..." vs títulos alternos del PDF:
      [normalizeLookupKey("Actividades al aire libre")]:815,
      [normalizeLookupKey("Actividades de la tarde")]:810,

      // Si alguna vez tu agente manda estos textos (que NO están como título exacto en el PDF),
      // los “redirigimos” a los títulos reales del PDF:
      [normalizeLookupKey("Juego libre")]:810,
      [normalizeLookupKey("Juegos de mesa")]:808,
    },
  elof: {
    [normalizeLookupKey("1.1 Enfoques de Aprendizaje - Creatividad")]: 818,
    [normalizeLookupKey("1.2 Enfoques de Aprendizaje - iniciativa y curiosidad")]: 819,
    [normalizeLookupKey("1.3 Enfoques de Aprendizaje - autoregulacion emocional y conductual")]: 820,
    [normalizeLookupKey("1.4 Enfoques de Aprendizaje - autoregulacion cognitiva")]: 821,

    // [normalizeLookupKey("2.1 Desarrollo Perceptual Motriz y Fisico - Percepción")]: ELOF_ID_21,
    [normalizeLookupKey("2.2 Desarrollo Perceptual Motriz y Fisico - Motricidad Gruesa")]: 823,
    [normalizeLookupKey("2.3 Desarrollo Perceptual Motriz y Fisico - Motricidad Fina")]: 824,
    [normalizeLookupKey("2.4 Desarrollo Perceptual Motriz y Fisico - Salud, seguridad y nutrición")]: 825,

    [normalizeLookupKey("3.1 Cognición - exploración y descubrimiento")]: 826,
    [normalizeLookupKey("3.2 Cognición - Memoria")]: 827,
    [normalizeLookupKey("3.3 Cognición - Razonamiento y Resolucion de problemas")]: 828,
    [normalizeLookupKey("3.4 Cognición - Pensamiento matemático emergente")]: 829,
    [normalizeLookupKey("3.5 Cognición - Imitación y representación simbólica")]:830,
    

    [normalizeLookupKey("4.1 Lenguage y Comunicación - Prestar atencion y entender")]: 831,
    [normalizeLookupKey("4.2 Lenguage y Comunicación - Comunicarse y hablar")]: 832,
    [normalizeLookupKey("4.3 Lenguage y Comunicación - Vocabulario")]: 833,
    [normalizeLookupKey("4.4 Lenguage y Comunicación - Lectoescritura")]: 834,

    [normalizeLookupKey("5.1 Resolución de Problemas - Relación con los adultos")]: 835,
    [normalizeLookupKey("5.2 Desarrollo Social y Emocional - Relación con otros niños")]: 836,
    [normalizeLookupKey("5.3 Desarrollo Social y Emocional - Funcionamiento emocional")]: 837,
    [normalizeLookupKey("5.4 Desarrollo Social y Emocional - Creatividad")]: 838,
    // [normalizeLookupKey("5.5 Desarrollo Social y Emocional - Autoregulación")]: ELOF_ID_55,
  },
  dominio_uc: {
    // 1.x Ecologia
    [normalizeLookupKey("1.1 Ecologia - Exploracion y descrubrimiento")]: 839,
    [normalizeLookupKey("1.2 Ecologia - Uso de Material Reciclado")]: 840,
    [normalizeLookupKey("1.3 Ecologia - Conciencia Ambientalista")]: 841,

    // 2.x Inteligencia Emocional
    [normalizeLookupKey("2.1 Inteligencia Emocional - Interactua con adultos y niños")]: 842,
    [normalizeLookupKey("2.2 Inteligencia Emocional - Sentido de Pertenencia")]: 843,
    [normalizeLookupKey("2.3 Inteligencia Emocional - Expresión de sentimientos y emociones")]: 844,

    // 3.x Tecnología
    [normalizeLookupKey("3.1 Tecnología - Lógica")]: 845,
    [normalizeLookupKey("3.2 Tecnología - Estructura")]: 16907,
    [normalizeLookupKey("3.3 Tecnología - Patrones y matrices")]: 846,

    // 4.x Innovación
    [normalizeLookupKey("4.1 Innovación - Presentación de ideas propias")]: 847,
    [normalizeLookupKey("4.2 Innovación - Generadores de actividades nuevas")]: 848,
    [normalizeLookupKey("4.3 Innovación - Intervención cambio y originalidad")]: 849,

    // 5.x Resolución de Problemas
    [normalizeLookupKey("5.1 Resolución de Problemas - Comprende las situaciones de su entorno")]: 850,
    [normalizeLookupKey("5.2 Resolución de Problemas - Incorpora soluciones ante el problema")]: 851,
    [normalizeLookupKey("5.3 Resolución de Problemas - Favorece la comunicación")]: 852,

    // 6.x Emprendimiento
    [normalizeLookupKey("6.1 Emprendimiento - Conciencia Social")]: 853,
    [normalizeLookupKey("6.2 Emprendimiento - Habilidades de liderazgo")]: 854,
    [normalizeLookupKey("6.3 Emprendimiento - Educación Financiera")]: 855,

    // 7.x Trabajo en Equipo
    [normalizeLookupKey("7.1 Trabajo en Equipo - Relación Social")]: 856,
    [normalizeLookupKey("7.2 Trabajo en Equipo - Habilidades de cooperación")]: 857,
    [normalizeLookupKey("7.3 Trabajo en Equipo - Intercambio de experiencias")]: 858,

    // 8.x Pensamiento Creativo
    [normalizeLookupKey("8.1 Pensamiento Creativo - Creatividad e imaginación")]: 859,
    [normalizeLookupKey("8.2 Pensamiento Creativo - Habilidades comunicativas")]: 860,
    [normalizeLookupKey("8.3 Pensamiento Creativo - Autonomía")]: 861,

    // 9.x Area Sensorial
    [normalizeLookupKey("9.1 Area Sensorial - Desarrollo Nocional")]: 862,
    [normalizeLookupKey("9.2 Area Sensorial - Descubrimiento de los sentidos")]: 863,
    [normalizeLookupKey("9.3 Area Sensorial - Exploración")]: 864,
  },
  edad: {
     // Meses (según título en el documento)
    [normalizeLookupKey("0 - 3 meses")]: 867,
    [normalizeLookupKey("3 - 6 meses")]: 868,
    [normalizeLookupKey("6 - 9 meses")]: 869,
    [normalizeLookupKey("9 - 12 meses")]: 870,
    [normalizeLookupKey("6-12 meses")]: 6202,

    // Años (según título en el documento)
    [normalizeLookupKey("1+ años")]: 788,
    [normalizeLookupKey("2+ años")]: 789,
    [normalizeLookupKey("3+ años")]: 790,

    [normalizeLookupKey("2 - 3 años")]: 6204,
    [normalizeLookupKey("1 - 2 años")]: 6203,

    [normalizeLookupKey("5 años")]: 99719,
    [normalizeLookupKey("6 años")]: 97626,
    [normalizeLookupKey("7 años")]: 97627,
    [normalizeLookupKey("8 años")]: 97635,
    [normalizeLookupKey("9 años")]: 97628,
    [normalizeLookupKey("10 años")]: 97629,
    [normalizeLookupKey("11 años")]: 97630,
    [normalizeLookupKey("12 años")]: 97631,

    // Programas
    [normalizeLookupKey("Afterschool (5yrs +)")]: 792,
    [normalizeLookupKey("Preschool (3 - 5 años)")]: 791,

    // Extras del documento
    [normalizeLookupKey("0-6 meses")]: 6201,
    [normalizeLookupKey("Infantes (0-1yr)")]: 787,

    // ✅ Aliases (entrada del agente -> ID existente)
    [normalizeLookupKey("6+ años")]: 97626,  // mismo ID que "6 años"
    [normalizeLookupKey("5+ años")]: 99719,  // mismo ID que "5 años"
    [normalizeLookupKey("preschool")]: 791,
    [normalizeLookupKey("afterschool")]: 792,
  },
};


function toIdList(mapObj, value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];

  const ids = [];
  for (const v of arr) {
    const key = normalizeLookupKey(v);
    const id = mapObj[key];
    if (id) ids.push(id);
  }

  // quitar duplicados
  return [...new Set(ids)];
}

/**
 * Si el campo ACF solo admite 1 valor, usamos una estrategia.
 * default: first -> toma el primero que llegó del agente y exista en el mapa.
 */
function toSingleId(mapObj, value, strategy = "first") {
  const ids = toIdList(mapObj, value);
  if (!ids.length) return null;

  if (strategy === "first") return ids[0];

  // (Opcional) otras estrategias si quieres:
  // if (strategy === "prefer_montessori") ...
  return ids[0];
}



function buildWpPayloadFromOutputJson(outputJson = {}, runId) {
  const titulo =
    outputJson.tema ||
    outputJson.titulo ||
    `Actividad ${runId || ""}`.trim();

  const descripcionActividad =
    outputJson.descripcion ||
    outputJson.resumen ||
    outputJson.objetivo ||
    outputJson.objective ||
    "";


  const contenidoPrincipal = descripcionActividad
    ? toHtmlParagraph(descripcionActividad)
    : "Sin descripción disponible.";

  const MESES_VALIDOS = new Set([
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre"
  ]);

  function normalizeMes(raw) {
    const v = normalizeKey(raw || "enero");
    return MESES_VALIDOS.has(v) ? v : "enero";
  }

  const ESTACIONES_VALIDAS = new Set(["verano","invierno","otono","primavera"]);

  function normalizeEstacion(raw) {
    const v = normalizeKey(raw || ""); // quita acentos => "otoño" -> "otono"
    return ESTACIONES_VALIDAS.has(v) ? v : "";
  }

  function normalizelang(raw) {
    const v = normalizeKey(raw || "");
    if (v === "espanol" || v === "es" ) return "es";
    if (v === "ingles" || v === "en" ) return "en";
    return "es";
  }

  const pasosHtml =
    outputJson.pasos_html || toHtmlOl(outputJson.pasos ?? outputJson.steps);

  const instrHtml =
    outputJson.instrucciones_html || toHtmlList(outputJson.instrucciones);

  const acfPayload = {
    // ✅ relaciones multi (array de IDs)
    curriculum: toIdList(ID_MAP.curriculum, outputJson.curriculum),
    momento_de_aprendizaje: toIdList(ID_MAP.momento, outputJson.momento_de_aprendizaje),
    elof: toIdList(ID_MAP.elof, outputJson.elof),
    dominios_uc: toIdList(ID_MAP.dominio_uc, outputJson.dominio_uc),
    grupo_de_edad: toIdList(ID_MAP.edad, outputJson.edad),

    // ✅ NO relación por ID (en tu WP es array de strings)
    enfoque_pedagojico: toStringList(outputJson.enfoque),

    instrucciones: `${instrHtml}\n${pasosHtml}`.trim(),

    materiales:
      outputJson.materiales_html ||
      toHtmlList(outputJson.materiales ?? outputJson.materials ?? inferMateriales(outputJson)),

    materiales_reciclables:
      outputJson.materiales_reciclables_html ||
      toHtmlList(outputJson.materiales_reciclables ?? outputJson.recycled_materials ?? []),

    objetivos:
      outputJson.objetivos_html ||
      toHtmlList(outputJson.objetivos ?? outputJson.objetivo ?? outputJson.objective),

    pasos: '',
      //outputJson.pasos_html ||
      //toHtmlOl(outputJson.pasos ?? outputJson.steps),

    tips: outputJson.tips_html || toHtmlParagraph(outputJson.tips),

    instrucciones_de_evaluacion:
      outputJson.instrucciones_de_evaluacion_html ||
      toHtmlParagraph(outputJson.instrucciones_de_evaluacion || outputJson.criteria || outputJson.evaluacion),

    requiere_plantilla: typeof outputJson.requiere_plantilla === "boolean"
      ? outputJson.requiere_plantilla
      : false,

    tipo_de_actividad: mapTipoDeActividad(outputJson.tipo_de_actividad || "actividades"),

    tiempo_en_minutos: outputJson.tiempo_en_minutos != null ? String(outputJson.tiempo_en_minutos) : "",

    dia_especifico: outputJson.dia_especifico || outputJson.fecha || "",
    mes: normalizeMes(outputJson.mes),
    estacion: normalizeEstacion(outputJson.estacion),
    language: normalizelang(outputJson.idioma || outputJson.language),
  };

  return {
    title: titulo,
    status: "draft", 
    content: contenidoPrincipal,
    acf: acfPayload,
  };
}


function toHtmlParagraph(text) {
  if (!text) return "";
  if (typeof text === "string" && /<\/?[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  return `<p>${text}</p>\n`;
}

function toHtmlList(value) {
  if (!value) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return `<p>${JSON.stringify(value)}</p>\n`;
  }
  if (typeof value === "string" && /<\/?[a-z][\s\S]*>/i.test(value)) {
    return value;
  }
  if (typeof value === "string") {
    return `<p>${value}</p>\n`;
  }
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => !!item)
      .map((item) => `<li>${item}</li>`)
      .join("\n");
    return `<ul>\n${items}\n</ul>\n`;
  }
  return "";
}

function inferMateriales(outputJson = {}) {
  const txt = String(
    outputJson.instrucciones_plain ||
    outputJson.instrucciones ||
    ""
  ).toLowerCase();
  const m = [];

  if (txt.includes("música")) m.push("Música suave");
  if (txt.includes("cartel")) m.push("Carteles de emociones");
  if (txt.includes("materiales artísticos") || txt.includes("materiales artisticos")) {
    m.push("Materiales artísticos (papel, colores, pegamento, tijeras seguras)");
  }

  return m;
}

function toHtmlOl(value) {
  if (!value) return "";
  if (typeof value === "string" && /<\/?[a-z][\s\S]*>/i.test(value)) return value;
  if (typeof value === "string") return `<p>${value}</p>\n`;
  if (Array.isArray(value)) {
    const items = value.filter(Boolean).map(v => `<li>${v}</li>`).join("\n");
    return `<ol>\n${items}\n</ol>\n`;
  }
  return "";
}

async function saveToWordPress(data) {
  try {
    const WP_URL = (process.env.WP_URL || "https://twinkle.acuarelacore.com").replace(/\/$/, "");
    const endpoint = `${WP_URL}/wp-json/wp/v2/actividades_logicas`;
    const jwt = (process.env.WP_JWT || "").trim();

    // 🔄 OPTIMIZACIÓN: Pre-renovar token JWT antes de crear/actualizar post
    // Esto evita que expire entre el CREATE y el UPDATE del ACF
    const { getValidToken } = require("../../utils/wp-auth");
    console.log(`🔐 [${data.run_id}] Pre-renovando JWT antes de guardar en WordPress...`);
    await getValidToken(); // Renueva si está cerca de expirar o ya expiró
    console.log(`✅ [${data.run_id}] Token JWT verificado y listo`);

    // Normalizar la estructura de output_json para soportar ambos formatos:
    // 1. Nuevo: campos ACF directamente en output_json
    // 2. Antiguo: campos ACF dentro de output_json.acf
    const normalizedOutput = normalizeOutputJson(data.output_json || {});
    
    // Si el objeto normalizado tiene title y acf, usamos esa estructura
    // Si no, usamos el builder legacy para compatibilidad
  const basePayload =
      normalizedOutput.title && normalizedOutput.acf && Object.keys(normalizedOutput.acf).length > 0
      ? {
            ...normalizedOutput,
            acf: sanitizeAcf(normalizedOutput.acf)
        }
      : buildWpPayloadFromOutputJson(data.output_json, data.run_id);

    // 2) Ajustes específicos de index.js (ej: slug, mantener draft)
    const rawSlug =
      normalizedOutput.slug ||
      normalizedOutput.acf?.tema ||
      normalizedOutput.title ||
      data.output_json?.tema ||
      data.output_json?.title ||
      `actividad-${data.run_id}`;

    const safeSlug = normalizeKey(rawSlug)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");


    // 2) Payload para CREAR el post (sin ACF)
    const { acf, ...baseWithoutAcf } = basePayload;

    const createBody = {
      ...baseWithoutAcf,
      status: basePayload?.status || "draft",
      slug: safeSlug,
    };

    // 3) Payload para ACTUALIZAR ACF (solo ACF)
    // acf ya fue sanitizado en basePayload, pero necesitamos asegurar que enfoque_general esté excluido
    const acfForUpdate = { ...(acf || {}) };
    const enfoqueGeneral = acfForUpdate._enfoque_general_temp;
    
    // Eliminar enfoque_general y la clave temporal de manera explícita
    delete acfForUpdate._enfoque_general_temp;
    delete acfForUpdate.enfoque_general; // Asegurar que no esté presente
    
    // Crear un nuevo objeto sin enfoque_general para asegurar que no esté presente
    const acfClean = {};
    for (const [key, value] of Object.entries(acfForUpdate)) {
      if (key !== 'enfoque_general' && key !== '_enfoque_general_temp') {
        acfClean[key] = value;
      }
    }
    
    // Log para debug
    console.log(`🔍 [${data.run_id}] ACF keys antes de enviar:`, Object.keys(acfClean));
    console.log(`🔍 [${data.run_id}] enfoque_general presente?:`, 'enfoque_general' in acfClean);
    console.log(`🔍 [${data.run_id}] enfoque_general guardado para después:`, enfoqueGeneral);
    
    const acfBody = { acf: acfClean };
    const meResp = await makeAuthenticatedRequest(
      `${WP_URL}/wp-json/wp/v2/users/me`,
      {
        method: 'GET',
        headers: {
          "Accept": "application/json",
        },
      },
      false // Usar fetch nativo
    );

    const meText = await meResp.text();
    console.log("DEBUG /users/me status:", meResp.status);
    console.log("DEBUG /users/me body:", meText.slice(0, 300));
    console.log("WP payload ACF keys:", Object.keys(acfBody.acf || {}));
    console.log("WP payload ACF preview:", JSON.stringify(acfBody.acf, null, 2).slice(0, 1500));


    // ======================
    // A) CREATE (POST) sin ACF - Con renovación automática de JWT
    // ======================
    console.log("WP CREATE body preview:", JSON.stringify(createBody, null, 2).slice(0, 800));

    const createResp = await makeAuthenticatedRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(createBody),
    }, false); // Usar fetch nativo

    const createText = await createResp.text();
    const createCT = createResp.headers.get("content-type") || "";

    if (!createResp.ok) {
      throw new Error(`WP CREATE ${createResp.status}: ${createText.slice(0, 300)}`);
    }
    if (!createCT.includes("application/json")) {
      throw new Error(`WP CREATE non-JSON. CT=${createCT}. Body=${createText.slice(0, 300)}`);
    }

    const createdPost = JSON.parse(createText);
    const postId = createdPost?.id;

    if (!postId) {
      throw new Error(`WP CREATE ok but missing id. Body=${createText.slice(0, 300)}`);
    }

    console.log("WP created post id:", postId);

    // ======================
    // B) UPDATE ACF (PATCH) - Con renovación automática de JWT
    // ======================
    const updateEndpoint = `${endpoint}/${postId}`;
    
    // Separar enfoque_general del payload ACF principal (ya está separado arriba)
    const acfWithoutEnfoque = acfBody.acf;
    
    console.log("WP PATCH ACF keys:", Object.keys(acfWithoutEnfoque || {}));
    console.log("WP PATCH ACF preview:", JSON.stringify(acfWithoutEnfoque, null, 2).slice(0, 1200));

    const patchResp = await makeAuthenticatedRequest(updateEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ acf: acfWithoutEnfoque }),
    }, false); // Usar fetch nativo

    const patchText = await patchResp.text();
    const patchCT = patchResp.headers.get("content-type") || "";

    if (!patchResp.ok) {
      throw new Error(`WP PATCH ${patchResp.status}: ${patchText.slice(0, 300)}`);
    }
    if (!patchCT.includes("application/json")) {
      throw new Error(`WP PATCH non-JSON. CT=${patchCT}. Body=${patchText.slice(0, 300)}`);
    }

    const patchedPost = JSON.parse(patchText);

    // ======================
    // C) Actualizar enfoque_general por separado si existe
    // ======================
    if (enfoqueGeneral !== undefined && Array.isArray(enfoqueGeneral) && enfoqueGeneral.length > 0) {
      console.log(`📝 [${data.run_id}] Actualizando enfoque_general por separado:`, enfoqueGeneral);
      try {
        // Intentar actualizar enfoque_general usando solo los IDs
        const enfoquePayload = { 
          acf: { 
            enfoque_general: enfoqueGeneral.map(id => typeof id === 'number' ? id : (id?.id || id))
          } 
        };
        
        const enfoqueResp = await makeAuthenticatedRequest(updateEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(enfoquePayload),
        }, false);
        
        if (enfoqueResp.ok) {
          console.log(`✅ [${data.run_id}] enfoque_general actualizado correctamente`);
        } else {
          const enfoqueText = await enfoqueResp.text();
          console.warn(`⚠️ [${data.run_id}] No se pudo actualizar enfoque_general: ${enfoqueText.slice(0, 200)}`);
          // No lanzar error, solo registrar advertencia
        }
      } catch (enfoqueErr) {
        console.warn(`⚠️ [${data.run_id}] Error al actualizar enfoque_general:`, enfoqueErr.message);
        // No lanzar error, solo registrar advertencia
      }
    }

    // ✅ Devuelve el post ya con ACF actualizado
    return { success: true, post: patchedPost, created_post: createdPost, wp_post_id: postId };


  } catch (err) {
    return { success: false, error: err?.message || "WordPress error" };
  }
}


module.exports = async function handler(req, res) {
  const startTime = Date.now();

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const auth = validateAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json(auth.payload);
   
  }

try {
    const data = req.body;
    if (typeof data.needs_clarification !== "boolean") {
      data.needs_clarification = false;
    }
    const bodyValidation = validateBody(data);
    if (!bodyValidation.ok) {
      await appendUsageLog({
        level: "error",
        event: "invalid_request_body",
        run_id: data?.run_id || "",
        details: {
          run_id: data?.run_id,
          needs_clarification: data?.needs_clarification,
          has_output_json: !!data?.output_json
        }
      });

      return res
        .status(bodyValidation.status)
        .json(bodyValidation.payload);
    }

    // Log inicial
    await appendUsageLog({
      level: "info",
      event: "request_received",
      run_id: data.run_id,
      needs_clarification: data.needs_clarification,
      agent:
        data.output_json?.acf?.framework ||
        data.output_json?.acf?.tipo_razonamiento ||
        data.output_json?.agent ||
        null,

    });


    console.log("Actividad recibida:", data.run_id);

    const airtableResult = await saveToAirtable(data);
    const wpResult = await saveToWordPress(data);
    if (airtableResult?.success && wpResult?.success) {
      const airtableRecordId = airtableResult.record?.id;
      const wpPostId = wpResult.wp_post_id || wpResult.post?.id || wpResult.created_post?.id;

      await updateAirtableWithWpPostId(airtableRecordId, wpPostId);
    }


    const durationMs = Date.now() - startTime;

    // Log final
    await appendUsageLog({
      level: "info",
      event: "process_completed",
      run_id: data.run_id,
      duration_ms: durationMs,
      details: {
        airtable_success: airtableResult.success,
        wordpress_success: wpResult.success,
        airtable_error: airtableResult.success ? null : airtableResult.error,
        wordpress_error: wpResult.success ? null : wpResult.error,
      },
    });

    return res.status(201).json({
      message: "Proceso completado",
      airtable: airtableResult,
      wordpress: wpResult,
      wp_post_id: wpResult?.wp_post_id || null
    });

  } catch (error) {
    const durationMs = Date.now() - startTime;

    console.error("Error general:", error);

    await appendUsageLog({
      level: "error",
      event: "unhandled_exception",
      run_id: req.body?.run_id,
      duration_ms: durationMs,
      message: error.message || "Unexpected error",
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Unexpected error",
    });
  }
}
