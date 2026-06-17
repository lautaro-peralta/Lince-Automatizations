/** Utilidades de presentación compartidas por el panel admin. */

/** Escapa texto para insertarlo como HTML sin riesgo de inyección. */
export function esc(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

/** Formatea una fecha ISO a algo legible en es-AR. */
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-AR') +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}

/** Formatea un número como pesos argentinos (sin decimales). */
export function fmtMoney(n) {
  if (n == null || n === '') return '—';
  return '$' + Number(n).toLocaleString('es-AR');
}

/** Construye un <select> de estados con el valor actual seleccionado. */
export function statusSelect(statuses, current) {
  const options = statuses
    .map((s) => `<option value="${s}"${s === current ? ' selected' : ''}>${s}</option>`)
    .join('');
  return options;
}

/**
 * Genera y descarga un CSV en el navegador (sin backend).
 * @param {string} filename  Nombre del archivo (ej: 'leads.csv').
 * @param {{key:string,label:string}[]} columns  Columnas a exportar.
 * @param {object[]} data  Filas (objetos).
 */
export function downloadCsv(filename, columns, data) {
  const cell = (v) => {
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
