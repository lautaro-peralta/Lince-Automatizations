/**
 * Estado de sesión del panel admin (auth en el cliente con Supabase).
 *
 * Reemplaza el malabar manual de onAuthStateChange del viejo admin.js: acá la
 * sesión es un estado reactivo ($state) que cualquier componente del panel lee.
 * El JWT se pasa al backend, que verifica token + rol admin.
 */
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '$lib/supabase';
import { t } from '$lib/i18n/index.svelte';

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

/** Traduce el error de Supabase a un mensaje claro (en el idioma actual). */
export function loginErrorMessage(error: { message?: string } | null): string {
	const m = (error?.message || '').toLowerCase();
	if (m.includes('invalid login')) return t('errors.auth.invalidLogin');
	if (m.includes('email not confirmed')) return t('errors.auth.emailNotConfirmed');
	if (m.includes('failed to fetch') || m.includes('network')) return t('errors.auth.network');
	return error?.message
		? t('errors.auth.genericWith', { message: error.message })
		: t('errors.auth.generic');
}
