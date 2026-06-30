/**
 * Módulo de i18n — runtime, sin dependencia de build.
 *
 * Los dos diccionarios (es/en) se empaquetan estáticamente, así que cambiar de
 * idioma es instantáneo: no hay fetch, ni recarga, ni rebuild. El idioma vive
 * en un `$state` universal (runes en `.svelte.ts`), de modo que cualquier
 * componente que llame a `t(...)` en su markup se re-renderiza solo al cambiar.
 *
 * La landing se prerenderiza en español (idioma por defecto, bueno para SEO).
 * En el cliente, `initLocale()` lee la preferencia guardada y, si es inglés,
 * conmuta al instante.
 */
import { browser } from '$app/environment';
import { es } from './locales/es';
import { en } from './locales/en';

export type Locale = 'es' | 'en';

export const LOCALES: Locale[] = ['es', 'en'];
export const LOCALE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English' };
export const LOCALE_SHORT: Record<Locale, string> = { es: 'ES', en: 'EN' };

const DEFAULT_LOCALE: Locale = 'es';
export const STORAGE_KEY = 'lince-locale';

const dictionaries: Record<Locale, unknown> = { es, en };

/** Estado reactivo del idioma. Mutarlo re-renderiza todo lo que usa `t()`. */
const i18n = $state<{ locale: Locale }>({ locale: DEFAULT_LOCALE });
let initialized = false;

function isLocale(v: unknown): v is Locale {
	return v === 'es' || v === 'en';
}

/** Lee la preferencia guardada (solo en el cliente). */
function stored(): Locale | null {
	if (!browser) return null;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return isLocale(saved) ? saved : null;
	} catch {
		return null;
	}
}

function applyLang(l: Locale) {
	if (browser) document.documentElement.setAttribute('lang', l);
}

/**
 * Sincroniza el estado con la preferencia del usuario. Idempotente: se puede
 * llamar en el `onMount` del layout sin riesgo de duplicar efectos.
 */
export function initLocale() {
	if (initialized || !browser) return;
	initialized = true;
	const saved = stored();
	if (saved) i18n.locale = saved;
	applyLang(i18n.locale);
}

/** Idioma actual (lectura reactiva). */
export function getLocale(): Locale {
	return i18n.locale;
}

export function setLocale(l: Locale) {
	if (!isLocale(l)) return;
	i18n.locale = l;
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, l);
		} catch {
			/* almacenamiento no disponible: el cambio igual aplica en memoria */
		}
		applyLang(l);
	}
}

export function toggleLocale() {
	setLocale(i18n.locale === 'es' ? 'en' : 'es');
}

/** Camina un objeto por una clave con puntos (`a.b.c`). */
function lookup(dict: unknown, key: string): unknown {
	return key.split('.').reduce<unknown>((acc, part) => {
		if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
			return (acc as Record<string, unknown>)[part];
		}
		return undefined;
	}, dict);
}

/**
 * Traduce una clave por puntos. Si falta en el idioma actual, cae al idioma
 * por defecto, y como último recurso devuelve la propia clave (visible en dev).
 * Interpola `{param}` desde `params`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
	const raw = lookup(dictionaries[i18n.locale], key) ?? lookup(dictionaries[DEFAULT_LOCALE], key);
	if (typeof raw !== 'string') return key;
	if (!params) return raw;
	return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
		params[name] != null ? String(params[name]) : `{${name}}`
	);
}
