const sharp = require("sharp");
const FormData = require("form-data");
const axios = require("axios");
const { makeAuthenticatedRequest } = require("../../utils/wp-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const WP_URL = (process.env.WP_URL || "").replace(/\/$/, "");
    const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
    
    // WP_JWT es manejado internamente por wp-auth.js (con renovación automática)
    const WP_JWT = (process.env.WP_JWT || "").trim();

    if (!WP_URL || !WP_JWT || !OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing env vars",
        details: {
          WP_URL: !!WP_URL,
          WP_JWT: !!WP_JWT,
          OPENAI_API_KEY: !!OPENAI_API_KEY,
        },
      });
    }

    // 🔄 PASO 0: RENOVAR JWT TOKEN ANTES DE TODO
    // Esto es LO PRIMERO que hacemos para asegurar token fresco durante TODO el proceso
    const { getValidToken } = require("../../utils/wp-auth");
    const run_id_temp = req.body?.run_id || "unknown";
    
    console.log(`🔐 [${run_id_temp}] PASO 0: Renovando JWT token ANTES de procesar solicitud...`);
    await getValidToken(); // Renueva si está cerca de expirar o ya expiró
    console.log(`✅ [${run_id_temp}] JWT token renovado/verificado - Listo para procesar`);

    const {
      run_id,
      prompt,
      n = 3,
      size = "1024x1024",
      wp_post_id,      // <-- ID de planessemanales o actividadlogicomatematica a actualizar
      update_fields,   // <-- ["foto"] o ["multimedia"] o ["plantilla_es"] o varios
      requiere_plantilla, // <-- Campo requiere_plantilla de la actividad
      num_imagen,      // <-- Número de imagen: 0 para plantilla, != 0 para evidencia
    } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Normaliza cantidad de imágenes
    const nInt = Math.min(Math.max(Number(n) || 3, 1), 4);

    console.log(`🎨 [${run_id}] Generating ${nInt} images with prompt: "${prompt.slice(0, 50)}..."`);

    // 1) OpenAI: SOLO campos válidos para OpenAI
    const oaiResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        n: nInt,
      }),
    });

    const oaiText = await oaiResp.text();
    if (!oaiResp.ok) {
      return res.status(502).json({
        error: "OpenAI image generation failed",
        status: oaiResp.status,
        details: oaiText.slice(0, 800),
      });
    }

    const oaiJson = JSON.parse(oaiText);

    if (!oaiJson?.data?.length) {
      return res.status(502).json({
        error: "OpenAI returned empty data",
        details: oaiJson,
      });
    }

    console.log(`✅ [${run_id}] OpenAI generated ${oaiJson.data.length} images successfully`);

    // 2) Subir a WP Media y actualizar ACF (SÍNCRONO)
    const previews = [];

    for (let i = 0; i < oaiJson.data.length; i++) {
      const b64 = oaiJson.data[i].b64_json;
      const inputBuffer = Buffer.from(b64, "base64");

      console.log(`📤 [${run_id}] Processing image ${i + 1}/${oaiJson.data.length}...`);

      const form = new FormData();
      // Convertir a JPEG SIEMPRE
      const jpegBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 90 }) // ajusta calidad 1-100
        .toBuffer();

      const filename = `${(run_id || "deeplingual")}-preview-${i + 1}-${Date.now()}.jpg`;
      console.log(`  ↳ Converted to JPEG: ${filename} (${Math.round(jpegBuffer.length / 1024)}KB)`);

      // 🔥 FIX: En Node.js, form-data acepta Buffer directamente
      form.append("file", jpegBuffer, {
        filename: filename,
        contentType: "image/jpeg",
      });
      form.append("title", `Preview ${i + 1} - ${run_id || "DeepLingual"}`);

      // 🔥 CLAVE: asociar el adjunto al post (uploaded_to)
      if (wp_post_id) {
        form.append("post", String(wp_post_id));
      }

      // 🔥 Usar makeAuthenticatedRequest para manejar FormData con renovación automática de JWT
      let wpResp, media;
      try {
        wpResp = await makeAuthenticatedRequest(
          `${WP_URL}/wp-json/wp/v2/media`,
          {
            method: 'POST',
            data: form,
            headers: {
              ...form.getHeaders(), // 🔥 CRÍTICO: Incluir headers de form-data (boundary)
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          },
          true // Usar axios
        );
        media = wpResp.data;
      } catch (error) {
        const status = error.response?.status || 500;
        const errorData = error.response?.data || error.message;
        console.error(`❌ [${run_id}] WP upload failed for image ${i + 1}: ${status}`);
        console.error(`   Response:`, JSON.stringify(errorData).slice(0, 400));
        return res.status(502).json({
          error: "WP media upload failed",
          status: status,
          details: JSON.stringify(errorData).slice(0, 800),
        });
      }
      console.log(`✅ [${run_id}] Image ${i + 1} uploaded to WP - Media ID: ${media.id}`);
      console.log(`   URL: ${media.source_url}`);
      previews.push({ media_id: media.id, url: media.source_url });

      // 🔧 3.1 Obtener URL final y verificar sincronización con WP Stateless
      try {
        const syncResp = await makeAuthenticatedRequest(
          `${WP_URL}/wp-json/deeplingual/v1/sync-media/${media.id}`,
          {
            method: 'POST',
            data: {},
            headers: {
              'Content-Type': 'application/json'
            },
          },
          true // Usar axios
        );
        
        const isGCS = syncResp.data.is_gcs;
        const statelessActive = syncResp.data.stateless_active;
        
        if (isGCS) {
          console.log(`✅ [${run_id}] Image synced to GCS (${syncResp.data.method})`);
        } else if (statelessActive) {
          console.log(`✅ [${run_id}] WP Stateless active (${syncResp.data.method}) - URL: WordPress local`);
        } else {
          console.log(`✅ [${run_id}] Metadata regenerated - No WP Stateless detected`);
        }
        
        console.log(`   Final URL: ${syncResp.data.url}`);
        
        // Actualizar URL si cambió después de la regeneración
        if (syncResp.data.url) {
          previews[previews.length - 1].url = syncResp.data.url;
        }
      } catch (e) {
        console.warn(`⚠️ [${run_id}] Metadata regeneration failed (non-critical):`, e.message);
        // Si falla, la URL original de WordPress seguirá funcionando
      }


      // 3) Guardar la imagen en el post (ACF)
      //    - Detectar el tipo de actividad según el prefijo de run_id
      //    - deep-lingual-: guarda en planessemanales (comportamiento original)
      //    - deepgraphic-: guarda en actividadlogicomatematica
      if (wp_post_id) {
        // Determinar el endpoint y campos según el run_id
        let endpoint = "planessemanales";
        let defaultFields = ["foto"];

        const isLogic = run_id && run_id.startsWith("deepgraphic-");
        if (isLogic) {
          endpoint = "actividades_logicas";
          defaultFields = ["multimedia_es", "multimedia_en", "foto"];
        }

        // Aliases para compatibilidad con agentes viejos
        const FIELD_ALIASES = isLogic
          ? {
              plantilla_es: "multimedia_es",
              plantilla_en: "multimedia_en",
              evidencia: "foto",
              multimedia: "multimedia_es",
            }
          : {
              evidencia: "foto", // Mapear evidencia a foto también para curriculum
            };

        const normalizeField = (f) => FIELD_ALIASES[f] || f;

        // Usar requiere_plantilla recibido en el request body
        const requierePlantilla = requiere_plantilla === true;
        const numImagen = Number(num_imagen) || 0;
        console.log(`📋 [${run_id}] requiere_plantilla recibido: ${requierePlantilla}, num_imagen: ${numImagen}`);

        // Determinar campos a actualizar
        let fields;
        
        // Para actividades matemáticas (lógicas), SIEMPRE guardar en todos los campos
        // (sin considerar requiere_plantilla)
        if (isLogic) {
          fields = ["multimedia_es", "multimedia_en", "foto"];
          console.log(`🔢 [${run_id}] Actividad matemática - Guardando en todos los campos: multimedia_es, multimedia_en, foto`);
        } else if (!requierePlantilla) {
          // Para actividades curriculares, si requiere_plantilla es false, solo actualizar el campo foto
          fields = ["foto"];
          console.log(`📸 [${run_id}] Actividad curricular, requiere_plantilla es false - Solo actualizando campo foto`);
        } else {
          // Si requiere_plantilla es true (curriculum), usar num_imagen para determinar dónde guardar
          if (numImagen === 0) {
            // Primera imagen (num_imagen = 0): guardar en plantilla_es (multimedia_es) y plantilla_en (multimedia_en)
            fields = ["multimedia_es", "multimedia_en"];
            console.log(`📋 [${run_id}] Actividad curricular, requiere_plantilla es true, num_imagen = 0 - Guardando en multimedia_es y multimedia_en`);
          } else {
            // Segunda imagen (num_imagen != 0): guardar en evidencia (foto)
            fields = ["foto"];
            console.log(`📸 [${run_id}] Actividad curricular, requiere_plantilla es true, num_imagen = ${numImagen} - Guardando en evidencia (foto)`);
          }
        }

        const updatePayload = { acf: {} };
        for (const f of fields) updatePayload.acf[f] = media.id;

        // NO modificar requiere_plantilla - dejarlo como está

        try {
          // Usar POST en lugar de PUT (como en pedagogical-outputs-logic)
          // WordPress REST API acepta POST para actualizar posts
          const updateUrl = `${WP_URL}/wp-json/wp/v2/${endpoint}/${wp_post_id}`;
          console.log(`🔄 [${run_id}] Intentando actualizar ACF en: ${updateUrl}`);
          console.log(`   Campos a actualizar: ${fields.join(", ")}`);
          console.log(`   Media ID: ${media.id}`);
          
          await makeAuthenticatedRequest(
            updateUrl,
            {
              method: 'POST',
              data: updatePayload,
              headers: {
                "Content-Type": "application/json",
              },
            },
            true // Usar axios
          );
          console.log(`✅ [${run_id}] ACF fields updated for ${endpoint} post ${wp_post_id}: ${fields.join(", ")}`);
        } catch (error) {
          const status = error.response?.status || 500;
          const errorData = error.response?.data || error.message;
          console.error(`❌ [${run_id}] ACF update failed for ${endpoint} post ${wp_post_id}: ${status}`);
          console.error(`   URL intentada: ${WP_URL}/wp-json/wp/v2/${endpoint}/${wp_post_id}`);
          console.error(`   Error completo:`, JSON.stringify(errorData, null, 2));
          
          // Información adicional si el error es por token
          if (status === 401 || status === 403) {
            console.error(`   💡 Verifica que WP_USERNAME y WP_PASSWORD estén configurados para renovación automática`);
          }
          
          // Si es 404, intentar verificar si el post existe
          if (status === 404) {
            console.error(`   ⚠️ Post ${wp_post_id} no encontrado en endpoint ${endpoint}`);
            console.error(`   💡 Verifica que el post exista y que el endpoint sea correcto`);
          }
          
          // No retornar error fatal, solo registrar y continuar
          // La imagen ya se subió correctamente, solo falló la actualización del ACF
          console.warn(`⚠️ [${run_id}] La imagen se subió correctamente (media_id: ${media.id}), pero falló la actualización del ACF`);
          console.warn(`   La imagen está disponible en: ${media.source_url}`);
          console.warn(`   Puedes actualizar manualmente el post ${wp_post_id} con media_id ${media.id}`);
        }
      }
    }

    console.log(`🎉 [${run_id}] Process completed successfully - ${previews.length} images uploaded`);

    return res.status(200).json({
      run_id: run_id || null,
      wp_post_id: wp_post_id || null,
      previews,
    });
  } catch (err) {
    console.error("created_img fatal:", err);
    return res.status(500).json({
      error: "FUNCTION_CRASH",
      details: err?.message || String(err),
    });
  }
};
