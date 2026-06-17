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
