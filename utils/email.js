// utils/email.js
const axios = require("axios");

const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY?.trim();

if (!MANDRILL_API_KEY) {
  console.warn('⚠️  [email] MANDRILL_API_KEY no está configurado. Los correos no se enviarán.');
}

function parseRecipients(v) {
  return String(v || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

async function sendTemplateRequiredEmail({ runId, wpPostId, title, airtableRecordId }) {
  // Verificar que Mandrill API Key esté configurado
  if (!MANDRILL_API_KEY) {
    throw new Error("MANDRILL_API_KEY no está configurado. No se puede enviar correo.");
  }

  const to = parseRecipients(process.env.EMAIL_TO_TEMPLATES);
  if (!to.length) {
    throw new Error("EMAIL_TO_TEMPLATES vacío o no configurado");
  }

  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM vacío o no configurado");
  }

  const subject = `Plantilla requerida: ${title || runId || "Actividad"}`;

  const html = `
    <h2>Actividad requiere plantilla o apoyo visual</h2>
    <ul>
      <li><strong>Run ID:</strong> ${runId || ""}</li>
      <li><strong>WP Post ID:</strong> ${wpPostId || ""}</li>
      <li><strong>Airtable Record ID:</strong> ${airtableRecordId || ""}</li>
      <li><strong>Título:</strong> ${title || ""}</li>
    </ul>
    <p>Acción: asignar/diseñar plantilla y adjuntarla al flujo correspondiente.</p>
  `;

  console.log(`📧 [email] Enviando correo de plantilla requerida con Mandrill...`);
  console.log(`   Desde: ${from}`);
  console.log(`   Para: ${to.join(', ')}`);
  console.log(`   Asunto: ${subject}`);

  try {
    // Mandrill API endpoint
    const mandrillUrl = 'https://mandrillapp.com/api/1.0/messages/send.json';
    
    // Preparar el payload para Mandrill
    const message = {
      html: html,
      subject: subject,
      from_email: from,
      from_name: from.split('@')[0] || 'DeepLingual API',
      to: to.map(email => ({
        email: email,
        type: 'to'
      })),
      important: false,
      track_opens: true,
      track_clicks: true,
      auto_text: true,
      auto_html: false,
      inline_css: true,
      preserve_recipients: false,
      view_content_link: false,
      tracking_domain: null,
      signing_domain: null,
      return_path_domain: null
    };

    const payload = {
      key: MANDRILL_API_KEY,
      message: message
    };

    const response = await axios.post(mandrillUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const result = response.data;
    
    // Mandrill devuelve un array con el resultado de cada destinatario
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      console.log(`✅ [email] Correo enviado exitosamente con Mandrill`);
      console.log(`   ID: ${firstResult._id || 'N/A'}`);
      console.log(`   Estado: ${firstResult.status || 'N/A'}`);
      console.log(`   Email: ${firstResult.email || 'N/A'}`);
      
      return {
        success: true,
        mandrillResponse: result,
        messageId: firstResult._id
      };
    } else {
      throw new Error('Respuesta inesperada de Mandrill');
    }
  } catch (error) {
    console.error(`❌ [email] Error al enviar correo con Mandrill:`, error.message);
    
    // Manejo específico de errores de Mandrill
    if (error.response?.data) {
      const errorData = error.response.data;
      console.error(`   Error de Mandrill:`, JSON.stringify(errorData, null, 2));
      
      if (errorData.name === 'Invalid_Key') {
        console.error(`\n💡 SOLUCIÓN: MANDRILL_API_KEY es inválido`);
        console.error(`   Verifica que la API Key sea correcta en Vercel\n`);
      } else if (errorData.name === 'ValidationError') {
        console.error(`\n💡 SOLUCIÓN: Error de validación`);
        console.error(`   Verifica que EMAIL_FROM y EMAIL_TO_TEMPLATES sean correctos\n`);
      }
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Datos: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    throw error;
  }
}

module.exports = { sendTemplateRequiredEmail };