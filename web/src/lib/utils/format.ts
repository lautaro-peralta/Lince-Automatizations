/** Utilidades de presentación compartidas por el panel admin. */
import type { ApiError } from '$lib/api';

/** Formatea una fecha ISO a algo legible en es-AR. */
export function fmtDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	return (
		d.toLocaleDateString('es-AR') +
		' ' +
		d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
	);
}

/** Formatea un número como pesos argentinos (sin decimales). */
export function fmtMoney(n: number | string | null | undefined): string {
	if (n == null || n === '') return '—';
	return '$' + Number(n).toLocaleString('es-AR');
}

export interface CsvColumn {
	key: string;
	label: string;
}

/**
 * Genera y descarga un CSV en el navegador (sin backend).
 * Solo corre en el cliente (usa document/Blob/URL).
 */
export function downloadCsv(
	filename: string,
	columns: CsvColumn[],
	data: Record<string, unknown>[]
): void {
	const cell = (v: unknown) => {
		const s = v == null ? '' : String(v);
		// Entrecomilla si hay comas, comillas o saltos de línea (RFC 4180).
		return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
	};
	const header = columns.map((c) => cell(c.label)).join(',');
	const rows = data.map((row) => columns.map((c) => cell(row[c.key])).join(','));
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
	if (err?.status === 403)
		return 'Iniciaste sesión, pero tu usuario no tiene rol admin. Promovelo (ver supabase/README.md).';
	if (err?.status === 401) return 'Tu sesión expiró o es inválida. Volvé a entrar.';
	return fallback;
}
