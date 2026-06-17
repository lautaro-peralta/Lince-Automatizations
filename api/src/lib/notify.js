/**
 * Capa de notificaciones del backend (desacoplada por proveedor).
 *
 * Filosofía:
 *   - Es 100% opcional y TOLERANTE A FALLOS: nunca debe romper ni demorar el
 *     flujo principal (ej. guardar un lead). Por eso se usa "fire-and-forget".
 *   - Sin ninguna variable configurada, solo loguea por consola.
 *   - Soporta varios canales a la vez (webhook genérico + email Resend).
 *
 * Cómo activarla: cargá en el entorno alguna de estas variables
 *   NOTIFY_WEBHOOK_URL   -> POST JSON a esa URL (Make/Zapier/Discord/Slack/...)
 *   RESEND_API_KEY + NOTIFY_EMAIL_TO  -> email vía Resend
 */
import { config } from '../config.js';

/**
 * Avisa de un lead nuevo por todos los canales configurados.
 * Pensada para llamarse SIN await (fire-and-forget) desde la ruta.
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
 * Envía a todos los canales configurados. Si no hay ninguno, loguea.
 * Usa allSettled para que el fallo de un canal no afecte a los demás.
 */
async function dispatch({ type, subject, text, data }) {
  const tasks = [];
  if (config.notify.webhookUrl) {
    tasks.push(sendWebhook(config.notify.webhookUrl, { type, subject, text, data }));
  }
  if (config.notify.resendApiKey && config.notify.emailTo) {
    tasks.push(sendEmail({ subject, text }));
  }

  if (tasks.length === 0) {
    // Sin proveedores: dejamos rastro en los logs del server.
    // eslint-disable-next-line no-console
    console.log('[notify]', subject, '\n' + text);
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
