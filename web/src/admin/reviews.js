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
        <p class="review-suggested"${r.suggested_response ? '' : ' hidden'}>Sugerida: <span class="review-suggested-text">${esc(r.suggested_response || '')}</span></p>
        <div class="review-foot">
          <select class="row-status">${statusSelect(REVIEW_STATUSES, r.status || 'nueva')}</select>
          <button class="btn-suggest" type="button">✨ Sugerir respuesta</button>
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

    // Botón "Sugerir respuesta": pide a la API una respuesta y la muestra.
    wrap.querySelectorAll('.btn-suggest').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const card = btn.closest('.review-card');
        const id = card.dataset.id;
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Generando…';
        try {
          const { data } = await apiFetch(`/api/reviews/${id}/suggest`, { method: 'POST', token });
          const p = card.querySelector('.review-suggested');
          const span = card.querySelector('.review-suggested-text');
          if (span && data) span.textContent = data.suggested_response || '';
          if (p) p.hidden = false;
          btn.textContent = original;
        } catch {
          btn.textContent = 'Error';
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  await fetchAndRender();
}
