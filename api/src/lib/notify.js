/**
 * Capa de notificaciones del backend (desacoplada por proveedor).
 *
 * Filosofía:
 *   - Es 100% opcional y TOLERANTE A FALLOS: nunca debe romper ni demorar el
 *     flujo principal (ej. guardar un lead). Por eso se usa "fire-and-forget".
 *   - Sin ninguna variable configurada, solo loguea por consola.
 *   - Soporta varios canales a la vez (webhook genérico + n8n + email Resend).
 *
 * Cómo activarla: cargá en el entorno alguna de estas variables
 *   NOTIFY_WEBHOOK_URL   -> POST JSON a esa URL (Make/Zapier/Discord/Slack/...)
 *   N8N_WEBHOOK_URL      -> POST JSON a n8n. Autentica con Basic Auth si hay
 *                           N8N_WEBHOOK_USERNAME + N8N_WEBHOOK_PASSWORD, y/o con
 *                           el header x-lince-secret si hay N8N_WEBHOOK_SECRET.
 *   RESEND_API_KEY + NOTIFY_EMAIL_TO  -> email vía Resend
 */
import { config } from '../config.js';

/**
 * Avisa de un lead nuevo por todos los canales configurados.
 * Pensada para llamarse SIN await (fire-and-forget) desde las rutas.
 * @param {{name:string, contact:string, business?:string, message:string}} lead
 */
export async function notifyNewLead(lead) {
  const subject = `Nuevo lead: ${lead.name}`;
  const text =
    `📥 Nuevo lead desde la landing\n\n` +
    `Nombre: ${lead.name}\n` +
    (lead.business ? `Negocio: ${lead.business}\n` : '') +
    `Contacto: ${lead.contact}\n\n` +
    `Mensaje:\n${lead.message}`;

  await dispatch({ type: 'new_lead', subject, text, data: lead });
}

/**
 * Notifica sobre un prospecto nuevo (backend -> prospects).
 * @param {object} prospect
 */
export async function notifyProspect(prospect) {
  const subject = `Nuevo prospecto: ${prospect.nombre}`;
  const text =
    `📥 Nuevo prospecto desde la landing\n\n` +
    `Nombre: ${prospect.nombre}\n` +
    (prospect.empresa ? `Empresa: ${prospect.empresa}\n` : '') +
    `Email: ${prospect.email || '-'}\n` +
    `Tel: ${prospect.telefono || '-'}\n\n` +
    `Mensaje:\n${prospect.mensaje || ''}`;

  await dispatch({ type: 'prospect', subject, text, data: prospect });
}

/**
 * Envía a todos los canales configurados. Si no hay ninguno, loguea.
 * Usa allSettled para que el fallo de un canal no afecte a los demás.
 */
async function dispatch({ type, subject, text, data }) {
  const tasks = [];

  // Webhook genérico (NOTIFY_WEBHOOK_URL)
  if (config.notify.webhookUrl) {
    tasks.push(sendWebhook(config.notify.webhookUrl, { type, subject, text, data }));
  }

  // n8n (N8N_WEBHOOK_URL)
  if (config.n8n.webhookUrl) {
    tasks.push(sendN8n(config.n8n, data));
  }

  // Email vía Resend (https://resend.com).
  if (config.notify.resendApiKey && config.notify.emailTo) {
    tasks.push(sendEmail({ subject, text }));
  }

  if (tasks.length === 0) {
    // Sin proveedores: dejamos rastro en los logs del server.
    // eslint-disable-next-line no-console
    console.log('[notify] sin proveedores configurados:', subject, '\n' + text);
    return;
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === 'rejected') {
      // eslint-disable-next-line no-console
      console.error('[notify] canal falló:', r.reason?.message || r.reason);
    }
  }
}

/** POST JSON a un webhook genérico. */
async function sendWebhook(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`webhook respondió ${res.status}`);
}

/**
 * POST JSON a n8n. El nodo Webhook puede exigir Basic Auth (usuario/contraseña)
 * o Header Auth (x-lince-secret): mandamos lo que esté configurado en el .env.
 */
async function sendN8n({ webhookUrl, webhookSecret, webhookUsername, webhookPassword }, payload) {
  const headers = {
    'Content-Type': 'application/json',
    // UA explícito: el fetch de Node manda uno genérico y algunos WAF
    // (ej. Cloudflare delante de n8n cloud) filtran por User-Agent.
    'User-Agent': 'lince-api/1.0',
  };
  if (webhookUsername && webhookPassword) {
    headers.Authorization =
      'Basic ' + Buffer.from(`${webhookUsername}:${webhookPassword}`).toString('base64');
  }
  if (webhookSecret) headers['x-lince-secret'] = webhookSecret;
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Incluimos el cuerpo en el error: distingue un rechazo de auth de n8n
    // ("Authorization data is wrong!") de un bloqueo del WAF (HTML de Cloudflare).
    const body = (await res.text().catch(() => '')).slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`n8n webhook respondió ${res.status}${body ? `: ${body}` : ''}`);
  }
}

/** Envía un email con Resend (API HTTP simple). */
async function sendEmail({ subject, text }) {
  const { resendApiKey, emailFrom, emailTo } = config.notify;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: emailFrom, to: emailTo, subject, text }),
  });
  if (!res.ok) throw new Error(`resend respondió ${res.status}`);
}
