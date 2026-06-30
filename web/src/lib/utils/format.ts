/** Utilidades de presentación compartidas por el panel admin. */
import type { ApiError } from '$lib/api';
import { getLocale, t } from '$lib/i18n/index.svelte';

/** Locale BCP 47 para `Intl`, derivado del idioma de la app. */
function intlLocale(): string {
	return getLocale() === 'en' ? 'en-US' : 'es-AR';
}

/** Formatea una fecha ISO a algo legible en el idioma actual. */
export function fmtDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	const loc = intlLocale();
	return (
		d.toLocaleDateString(loc) +
		' ' +
		d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
	);
}

/** Formatea un número como pesos (sin decimales), agrupado según el idioma. */
export function fmtMoney(n: number | string | null | undefined): string {
	if (n == null || n === '') return '—';
	return '$' + Number(n).toLocaleString(intlLocale());
}

export interface CsvColumn {
	key: string;
	label: string;
}

/**
 * Genera y descarga un CSV en el navegador (sin backend).
 * Solo corre en el cliente (usa document/Blob/URL).
 */
export function downloadCsv<T extends object>(
	filename: string,
	columns: CsvColumn[],
	data: T[]
): void {
	const cell = (v: unknown) => {
		const s = v == null ? '' : String(v);
		// Entrecomilla si hay comas, comillas o saltos de línea (RFC 4180).
		return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
	};
	const header = columns.map((c) => cell(c.label)).join(',');
	const rows = data.map((row) =>
		columns.map((c) => cell((row as Record<string, unknown>)[c.key])).join(',')
	);
	// BOM inicial para que Excel respete los acentos (UTF-8).
	const csv = '﻿' + [header, ...rows].join('\r\n');

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/**
 * Mensaje claro para errores al cargar datos del panel.
 * Distingue 403 (logueado pero sin rol admin) de 401 (sesión inválida).
 */
export function loadErrorMessage(
	err: Partial<ApiError> | null | undefined,
	fallback: string
): string {
	if (err?.status === 403) return t('errors.load403');
	if (err?.status === 401) return t('errors.load401');
	return fallback;
}
