/**
 * Sección "Reseñas" del panel admin (Fase 3).
 * Lista las reseñas detectadas y permite cambiar su estado / marcarlas como
 * respondidas. (El monitor de la landing sigue siendo ilustrativo.)
 */
import { apiFetch } from '../lib/api.js';
import { esc, fmtDate, statusSelect } from '../lib/format.js';

const REVIEW_STATUSES = ['nueva', 'analizando', 'respondida'];

export async function loadReviews(container, token) {
  container.innerHTML = `
    <h1>Reseñas</h1>
    <p class="panel-hint">Reseñas detectadas para gestionar y responder.</p>
    <div id="reviews-status" class="panel-status"></div>
    <div id="reviews-wrap"></div>`;

  async function fetchAndRender() {
    const statusEl = container.querySelector('#reviews-status');
    const wrap = container.querySelector('#reviews-wrap');
    statusEl.textContent = 'Cargando…';
    wrap.innerHTML = '';
    try {
      const { data } = await apiFetch('/api/reviews', { token });
      const reviews = data || [];
      if (reviews.length === 0) {
        statusEl.textContent = 'No hay reseñas cargadas.';
        return;
      }
      statusEl.textContent = `${reviews.length} reseña(s).`;
      wrap.innerHTML = reviews.map(renderCard).join('');
      wireEvents(wrap);
    } catch (err) {
      statusEl.textContent =
        err.status === 401 ? 'Tu sesión no tiene permisos de admin.' : 'No pudimos cargar las reseñas.';
    }
  }

  function renderCard(r) {
    const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(Math.max(0, 5 - (r.rating || 0)));
    return `
      <div class="review-card" data-id="${r.id}">
        <div class="review-head">
          <span class="review-stars">${stars}</span>
          <span class="review-meta">${esc(r.source || '')} · ${esc(r.author || 'Anónimo')} · ${fmtDate(r.detected_at)}</span>
          ${r.priority ? `<span class="badge badge-${esc(r.priority)}">${esc(r.priority)}</span>` : ''}
        </div>
        <p class="review-text">${esc(r.text || '')}</p>
        ${r.suggested_response ? `<p class="review-suggested">Sugerida: ${esc(r.suggested_response)}</p>` : ''}
        <div class="review-foot">
          <select class="row-status">${statusSelect(REVIEW_STATUSES, r.status || 'nueva')}</select>
        </div>
      </div>`;
  }

  function wireEvents(wrap) {
    wrap.querySelectorAll('.row-status').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.closest('.review-card').dataset.id;
        e.target.classList.remove('saved', 'error');
        try {
          await apiFetch(`/api/reviews/${id}`, { method: 'PATCH', body: { status: e.target.value }, token });
          e.target.classList.add('saved');
          setTimeout(() => e.target.classList.remove('saved'), 1200);
        } catch {
          e.target.classList.add('error');
        }
      });
    });
  }

  await fetchAndRender();
}
