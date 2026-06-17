/**
 * Sugerencia de respuestas a reseñas con IA (Claude) — Fase 5.
 *
 * Tolerante a fallos: si no hay ANTHROPIC_API_KEY configurada, devuelve una
 * respuesta de plantilla (según el puntaje) en vez de llamar a la API. Así la
 * función sirve incluso sin credenciales y nunca rompe el panel.
 *
 * Usa el SDK oficial de Anthropic. El modelo por defecto es claude-opus-4-8
 * (configurable con ANTHROPIC_MODEL).
 */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

// Cliente solo si hay API key (si no, trabajamos con plantilla).
const client = config.anthropic.apiKey ? new Anthropic({ apiKey: config.anthropic.apiKey }) : null;

/**
 * Devuelve un borrador de respuesta para una reseña.
 * @param {{rating?:number, author?:string, source?:string, text?:string}} review
 * @returns {Promise<string>}
 */
export async function suggestReviewReply(review) {
  if (!client) return templateReply(review);

  const stars = review.rating ? `${review.rating}/5` : 'sin puntaje';
  const system =
    'Sos el encargado de atención al cliente de un negocio en Rosario, Argentina. ' +
    'Escribís respuestas a reseñas: cercanas, en español rioplatense, breves (2 a 4 oraciones), ' +
    'sin sonar robóticas. Si la reseña es negativa, mostrás empatía, te hacés cargo y ofrecés ' +
    'resolverlo por privado, sin excusas largas. Si es positiva, agradecés con calidez. ' +
    'No prometas compensaciones concretas (descuentos, reintegros). ' +
    'Respondé SOLO con el texto de la respuesta: sin comillas, sin preámbulos y sin explicar tu razonamiento.';
  const user =
    `Reseña (${stars}) de ${review.author || 'un cliente'} en ${review.source || 'la web'}:\n` +
    `"${review.text || ''}"\n\nEscribí la respuesta.`;

  try {
    const res = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return text || templateReply(review);
  } catch (err) {
    // Ante cualquier fallo de la API, no rompemos: caemos a la plantilla.
    // eslint-disable-next-line no-console
    console.error('[ai] fallo al sugerir respuesta:', err?.message || err);
    return templateReply(review);
  }
}

/** Respuesta de plantilla cuando no hay IA disponible. */
function templateReply(review) {
  const name = review.author ? ', ' + review.author : '';
  if ((review.rating || 0) >= 4) {
    return `¡Muchas gracias por tu reseña${name}! Nos alegra un montón que la hayas pasado bien. ¡Te esperamos pronto! 🙌`;
  }
  return `Lamentamos mucho la experiencia${name}. No es lo que queremos que pase. Nos encantaría escucharte y resolverlo — ¿nos escribís por privado así lo vemos juntos?`;
}
