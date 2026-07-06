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
 *   N8N_WEBHOOK_URL + N8N_WEBHOOK_SECRET -> POST JSON a n8n con header x-lince-secret
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
    tasks.push(sendN8n(config.n8n.webhookUrl, config.n8n.webhookSecret || '', data));
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

/** POST JSON a n8n con header secreto. */
async function sendN8n(url, secret, payload) {
  const headers = { 'Content-Type': 'application/json' };
  if (secret) headers['x-lince-secret'] = secret;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`n8n webhook respondió ${res.status}`);
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
