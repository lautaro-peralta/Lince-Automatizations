/**
 * Cliente de Supabase para el navegador (SOLO lo usa el panel admin).
 *
 * Usa la clave ANÓNIMA, pensada para exponerse en el frontend: por sí sola no
 * da acceso a nada (las tablas están protegidas por Row Level Security). Acá
 * solo la usamos para login/logout. Las lecturas/escrituras sensibles pasan por
 * el backend de Express con la service-role key.
 *
 * La landing pública NO importa este módulo.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const url = env.PUBLIC_SUPABASE_URL;
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

/** True si las variables de Supabase están configuradas. */
export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
	// Aviso solo para desarrollo (consola), sin exponer detalles al usuario.
	console.warn('[auth] Configuración de autenticación incompleta.');
}

// Placeholders válidos para que el módulo no rompa si faltan las variables.
export const supabase = createClient(
	url || 'http://localhost:54321',
	anonKey || 'anon-placeholder'
);
