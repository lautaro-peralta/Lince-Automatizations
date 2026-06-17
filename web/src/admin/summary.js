/**
 * Sección "Resumen" del panel admin (Fase 5).
 * Muestra métricas rápidas (conteos por estado) desde GET /api/stats.
 */
import { apiFetch } from '../lib/api.js';

export async function loadSummary(container, token) {
  container.innerHTML = `
    <h1>Resumen</h1>
    <p class="panel-hint">Una mirada rápida del estado del negocio.</p>
    <div id="summary-status" class="panel-status"></div>
    <div id="summary-grid" class="stat-grid"></div>`;

  const statusEl = container.querySelector('#summary-status');
  const grid = container.querySelector('#summary-grid');
  statusEl.textContent = 'Cargando…';

  try {
    const { data } = await apiFetch('/api/stats', { token });
    statusEl.textContent = '';
    grid.innerHTML = [
      card('Leads', data.leads, [
        ['Nuevos', data.leads.nuevo],
        ['En conversación', data.leads.en_conversacion],
        ['Ganados', data.leads.ganado],
      ]),
      card('Presupuestos', data.budgets, [
        ['Enviados', data.budgets.enviado],
        ['Sin respuesta', data.budgets.sin_respuesta],
        ['Ganados', data.budgets.ganado],
      ]),
      card('Reseñas', data.reviews, [
        ['Nuevas', data.reviews.nueva],
        ['Analizando', data.reviews.analizando],
        ['Respondidas', data.reviews.respondida],
      ]),
    ].join('');
  } catch (err) {
    statusEl.textContent =
      err.status === 401 ? 'Tu sesión no tiene permisos de admin.' : 'No pudimos cargar las métricas.';
  }
}

// Una tarjeta con el total grande y un desglose de líneas.
function card(title, group, lines) {
  const rows = lines
    .map(([label, n]) => `<div class="stat-line"><span>${label}</span><span>${n || 0}</span></div>`)
    .join('');
  return `
    <div class="stat-card">
      <div class="stat-card-title">${title}</div>
      <div class="stat-card-total">${group.total || 0}</div>
      <div class="stat-card-lines">${rows}</div>
    </div>`;
}
