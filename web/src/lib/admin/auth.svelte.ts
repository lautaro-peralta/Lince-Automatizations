/**
 * Estado de sesión del panel admin (auth en el cliente con Supabase).
 *
 * Reemplaza el malabar manual de onAuthStateChange del viejo admin.js: acá la
 * sesión es un estado reactivo ($state) que cualquier componente del panel lee.
 * El JWT se pasa al backend, que verifica token + rol admin.
 */
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '$lib/supabase';

export const auth = $state<{ session: Session | null; ready: boolean }>({
	session: null,
	ready: false
});

let initialized = false;

/** Inicializa los listeners de Supabase una sola vez. */
export function initAuth() {
	if (initialized) return;
	initialized = true;

	if (!supabaseConfigured) {
		auth.ready = true;
		return;
	}

	supabase.auth.getSession().then(({ data }) => {
		auth.session = data.session;
		auth.ready = true;
	});
	supabase.auth.onAuthStateChange((_event, session) => {
		auth.session = session;
		auth.ready = true;
	});
}

/** JWT de la sesión actual (o null). */
export function token(): string | null {
	return auth.session?.access_token ?? null;
}

/** Traduce el error de Supabase a un mensaje claro. */
export function loginErrorMessage(error: { message?: string } | null): string {
	const m = (error?.message || '').toLowerCase();
	if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
	if (m.includes('email not confirmed'))
		return 'Tu email todavía no está confirmado en Supabase (Authentication → Users → confirmar).';
	if (m.includes('failed to fetch') || m.includes('network'))
		return 'No pudimos conectar con Supabase. Revisá PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.';
	return error?.message
		? `No pudimos iniciar sesión: ${error.message}`
		: 'No pudimos iniciar sesión.';
}
