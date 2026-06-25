/**
 * Carga y centraliza la configuración del backend desde variables de entorno.
 *
 * `dotenv/config` lee el archivo .env en desarrollo. En Render las variables
 * vienen del panel del servicio, así que .env no hace falta allá.
 */
import 'dotenv/config';

/** Avisa (sin frenar el arranque) si falta una variable importante. */
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] Falta la variable de entorno ${name}. Revisá tu .env.`);
  }
  return value;
}

export const config = {
  // Render inyecta PORT; en local cae a 3000.
  port: Number(process.env.PORT) || 3000,
  isProd: process.env.NODE_ENV === 'production',

  // Supabase (service-role: uso exclusivo del servidor).
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  // Lista blanca de orígenes para CORS. Vacío => se permite todo (solo dev).
  // Normalizamos: sin espacios y SIN barra final (el header Origin nunca la trae,
  // así que una barra de más en la env rompería la comparación).
  corsOrigins: (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),

  // Notificaciones (todas opcionales). Si no hay ninguna configurada, el
  // módulo de notify solo loguea por consola; nunca rompe el flujo principal.
  notify: {
    // Webhook genérico (Make, Zapier, Discord, Slack, un bridge de WhatsApp…).
    webhookUrl: process.env.NOTIFY_WEBHOOK_URL || '',
    // Email vía Resend (https://resend.com).
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.NOTIFY_EMAIL_FROM || 'Lince <onboarding@resend.dev>',
    emailTo: process.env.NOTIFY_EMAIL_TO || '',
  },

  // IA (opcional). Si no hay API key, la sugerencia de respuestas usa una
  // plantilla local en vez de Claude. El modelo es configurable.
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
  },

  // n8n (webhook de prospectos). Opcional: si no se configura, el endpoint
  // igualmente guarda el prospecto en Supabase y omite el aviso.
  n8n: {
    webhookUrl:    process.env.N8N_WEBHOOK_URL    || '',
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
  },
};
