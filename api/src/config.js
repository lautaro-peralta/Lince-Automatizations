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
  corsOrigins: (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
