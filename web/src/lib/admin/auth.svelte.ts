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

export const auth = $state<{ session: Session | null; ready: boolean; recovery: boolean }>({
	session: null,
	ready: false,
	// true cuando el usuario llega desde un email de recuperación: hay que
	// mostrarle el formulario para elegir una contraseña nueva.
	recovery: false
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
	supabase.auth.onAuthStateChange((event, session) => {
		auth.session = session;
		auth.ready = true;
		if (event === 'PASSWORD_RECOVERY') auth.recovery = true;
	});
}

/** Envía el email de recuperación de contraseña. */
export function sendPasswordReset(email: string) {
	const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
	return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
}

/** Fija la contraseña nueva (tras llegar desde el email de recuperación). */
export async function updatePassword(password: string) {
	const { error } = await supabase.auth.updateUser({ password });
	if (!error) auth.recovery = false;
	return { error };
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

/**
 * Traduce el error de Supabase al FIJAR una contraseña nueva.
 *
 * La checklist de fortaleza corre en el cliente, pero la política REAL la aplica
 * Supabase (largo mínimo, complejidad, "distinta de la anterior", contraseñas
 * filtradas). Si el servidor rechaza, el mensaje tiene que hablar de "guardar la
 * contraseña" —esta pantalla—, no de "iniciar sesión" (usar loginErrorMessage
 * acá daba un "No pudimos iniciar sesión…" fuera de contexto).
 */
export function passwordUpdateErrorMessage(error: { message?: string } | null): string {
	const m = (error?.message || '').toLowerCase();
	if (m.includes('different from the old') || m.includes('should be different'))
		return t('admin.login.passwordSameAsOld');
	if (m.includes('at least') || m.includes('too short') || m.includes('length'))
		return t('admin.login.passwordWeak');
	if (
		m.includes('weak') ||
		m.includes('pwned') ||
		m.includes('leaked') ||
		m.includes('easy to guess')
	)
		return t('admin.login.passwordCommon');
	if (m.includes('failed to fetch') || m.includes('network')) return t('errors.auth.network');
	return error?.message
		? t('admin.login.passwordServerError', { message: error.message })
		: t('admin.login.passwordServerGeneric');
}
