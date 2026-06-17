/**
 * Registro de conversaciones del chatbot (Fase 3) — DESACOPLADO.
 *
 * Importante: NO modifica chatbot.js ni la experiencia de la demo. Observa los
 * mensajes que el demo agrega al DOM y los envía a la API (crea una sesión y
 * registra cada mensaje). Todo es silencioso y tolerante a fallos: si el
 * backend no está, no pasa nada visible.
 *
 * Se carga SOLO si está activada la variable VITE_CHATBOT_LOGGING (ver main.js),
 * para no generar requests en la demo estática hasta que el backend esté arriba.
 */
import { apiFetch } from '../lib/api.js';

// Slug del flujo cargado en la base (ver supabase/seed.sql).
const FLOW_SLUG = 'parrilla-el-fogon';

const body = document.getElementById('wa-body');
if (body) {
  let sessionId = null;
  let creating = false;

  // Crea la sesión una sola vez (perezosamente, con el primer mensaje).
  async function ensureSession() {
    if (sessionId || creating) return sessionId;
    creating = true;
    try {
      const { data } = await apiFetch('/api/chatbot/sessions', {
        method: 'POST',
        body: { flow_slug: FLOW_SLUG },
      });
      sessionId = data?.id || null;
    } catch {
      /* silencioso: el registro nunca debe afectar la demo */
    }
    creating = false;
    return sessionId;
  }

  // Registra un mensaje (fire-and-forget).
  async function logMessage(role, text) {
    try {
      const id = await ensureSession();
      if (!id) return;
      await apiFetch(`/api/chatbot/sessions/${id}/messages`, {
        method: 'POST',
        body: { role, text },
      });
    } catch {
      /* silencioso */
    }
  }

  // Observamos los nodos .wa-msg que el demo agrega al cuerpo del chat.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1 || !node.classList?.contains('wa-msg')) continue;
        const role = node.classList.contains('user') ? 'user' : 'bot';
        // El primer hijo es el texto del mensaje (después va el <span.wa-time>).
        const first = node.childNodes[0];
        const text =
          first && first.nodeType === 3 ? first.textContent.trim() : node.textContent.trim();
        if (text) logMessage(role, text);
      }
    }
  });
  observer.observe(body, { childList: true });
}
