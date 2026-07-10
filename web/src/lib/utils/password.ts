/**
 * Reglas de fortaleza de contraseña (compartidas por el panel admin y demás
 * módulos que fijan contraseñas). Cada regla es una clave de i18n + un test.
 *
 * La misma lista alimenta la checklist en vivo y la validación de envío, así
 * que "lo que se ve" y "lo que se valida" no pueden desincronizarse.
 */
export interface PasswordRule {
	/** Sufijo de la clave i18n (admin.login.rule<Key>). */
	key: 'Length' | 'Uppercase' | 'Lowercase' | 'Number' | 'Special';
	test: (pw: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const passwordRules: PasswordRule[] = [
	{ key: 'Length', test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
	{ key: 'Uppercase', test: (pw) => /[A-Z]/.test(pw) },
	{ key: 'Lowercase', test: (pw) => /[a-z]/.test(pw) },
	{ key: 'Number', test: (pw) => /\d/.test(pw) },
	{ key: 'Special', test: (pw) => /[^A-Za-z0-9]/.test(pw) }
];

/** Estado de cada regla para la contraseña dada (para pintar la checklist). */
export function passwordChecks(pw: string): Array<{ key: PasswordRule['key']; ok: boolean }> {
	return passwordRules.map((r) => ({ key: r.key, ok: r.test(pw) }));
}

/** Cuántas reglas cumple (0..N) — sirve para el medidor de fortaleza. */
export function passwordScore(pw: string): number {
	return passwordRules.reduce((n, r) => n + (r.test(pw) ? 1 : 0), 0);
}

/** true sólo si cumple todas las reglas. */
export function isPasswordValid(pw: string): boolean {
	return passwordRules.every((r) => r.test(pw));
}
