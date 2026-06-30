/**
 * Tema claro/oscuro — runtime, persistido, sin flash.
 *
 * El cambio es instantáneo: solo togglea el atributo `data-theme` en <html>,
 * y todo el sistema de design (variables `--color-*` de Tailwind v4) responde
 * en cascada. Un script inline en `app.html` aplica el tema antes del primer
 * pintado para evitar el flash; este store solo sincroniza el estado reactivo
 * y persiste la elección del usuario.
 */
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'lince-theme';

const theme = $state<{ value: Theme }>({ value: 'light' });
let initialized = false;

function systemPrefersDark(): boolean {
	return browser && typeof matchMedia !== 'undefined'
		? matchMedia('(prefers-color-scheme: dark)').matches
		: false;
}

/** Tema efectivo al cargar: preferencia guardada o, si no hay, la del sistema. */
function detect(): Theme {
	if (!browser) return 'light';
	try {
		const saved = localStorage.getItem(THEME_KEY);
		if (saved === 'light' || saved === 'dark') return saved;
	} catch {
		/* ignore */
	}
	return systemPrefersDark() ? 'dark' : 'light';
}

function apply(value: Theme) {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', value);
}

/** Sincroniza el store con lo que el script inline ya pintó. Idempotente. */
export function initTheme() {
	if (initialized || !browser) return;
	initialized = true;
	// El atributo ya fue puesto por el script inline; lo tomamos como verdad,
	// con `detect()` como red de seguridad si faltara.
	const current = document.documentElement.getAttribute('data-theme');
	theme.value = current === 'dark' ? 'dark' : current === 'light' ? 'light' : detect();
	apply(theme.value);
}

export function getTheme(): Theme {
	return theme.value;
}

export function setTheme(value: Theme) {
	theme.value = value;
	if (browser) {
		try {
			localStorage.setItem(THEME_KEY, value);
		} catch {
			/* ignore */
		}
		apply(value);
	}
}

export function toggleTheme() {
	setTheme(theme.value === 'dark' ? 'light' : 'dark');
}
