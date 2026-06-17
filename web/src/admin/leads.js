/**
 * Sección "Leads" del panel admin (Fase 2).
 * Lista los leads con búsqueda y filtro por estado, y permite cambiar el
 * estado y editar notas internas (PATCH /api/leads/:id).
 */
import { apiFetch } from '../lib/api.js';
import { esc, fmtDate, statusSelect, downloadCsv } from '../lib/format.js';

const LEAD_STATUSES = ['nuevo', 'contactado', 'en_conversacion', 'ganado', 'descartado'];

export async function loadLeads(container, token) {
  // Estructura fija de la sección (controles + zona de tabla).
  container.innerHTML = `
    <h1>Leads recibidos</h1>
    <p class="panel-hint">Contactos que llegaron desde el formulario de la landing.</p>
    <div class="toolbar">
      <input id="lead-q" class="toolbar-input" type="search" placeholder="Buscar nombre, negocio, contacto…" />
      <select id="lead-filter" class="toolbar-input">
        <option value="">Todos los estados</option>
        ${LEAD_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('')}
      </select>
      <button id="lead-export" class="toolbar-btn" type="button" disabled>Exportar CSV</button>
    </div>
    <div id="leads-status" class="panel-status"></div>
    <div id="leads-table-wrap"></div>`;

  const qInput = container.querySelector('#lead-q');
  const filter = container.querySelector('#lead-filter');
  const exportBtn = container.querySelector('#lead-export');

  // Guardamos los últimos leads cargados para poder exportarlos.
  let currentLeads = [];
  exportBtn.addEventListener('click', () => {
    if (currentLeads.length === 0) return;
    const columns = [
      { key: 'created_at', label: 'Fecha' },
      { key: 'name', label: 'Nombre' },
      { key: 'business', label: 'Negocio' },
      { key: 'contact', label: 'Contacto' },
      { key: 'message', label: 'Mensaje' },
      { key: 'status', label: 'Estado' },
      { key: 'notes', label: 'Notas' },
    ];
    const fecha = new Date().toISOString().slice(0, 10);
    downloadCsv(`leads-${fecha}.csv`, columns, currentLeads);
  });

  // Re-busca con un pequeño debounce al tipear.
  let t;
  qInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(fetchAndRender, 300);
  });
  filter.addEventListener('change', fetchAndRender);

  async function fetchAndRender() {
    const statusEl = container.querySelector('#leads-status');
    const wrap = container.querySelector('#leads-table-wrap');
    statusEl.textContent = 'Cargando…';
    wrap.innerHTML = '';

    const params = new URLSearchParams();
    if (filter.value) params.set('status', filter.value);
    if (qInput.value.trim()) params.set('q', qInput.value.trim());
    const qs = params.toString() ? `?${params}` : '';

    try {
      const { data } = await apiFetch(`/api/leads${qs}`, { token });
      const leads = data || [];
      currentLeads = leads;
      exportBtn.disabled = leads.length === 0;
      if (leads.length === 0) {
        statusEl.textContent = 'No hay leads para este filtro.';
        return;
      }
      statusEl.textContent = `${leads.length} lead(s).`;
      wrap.innerHTML = renderTable(leads);
      wireRowEvents(wrap);
    } catch (err) {
      currentLeads = [];
      exportBtn.disabled = true;
      statusEl.textContent =
        err.status === 401 ? 'Tu sesión no tiene permisos de admin.' : 'No pudimos cargar los leads.';
    }
  }

  function renderTable(leads) {
    const rows = leads
      .map(
        (l) => `
      <tr data-id="${l.id}">
        <td>${fmtDate(l.created_at)}</td>
        <td>${esc(l.name)}</td>
        <td>${esc(l.business || '—')}</td>
        <td>${esc(l.contact)}</td>
        <td class="cell-msg">${esc(l.message)}</td>
        <td><select class="row-status">${statusSelect(LEAD_STATUSES, l.status || 'nuevo')}</select></td>
        <td>
          <input class="row-notes" type="text" value="${esc(l.notes || '')}" placeholder="Notas…" />
        </td>
      </tr>`
      )
      .join('');
    return `<table class="data-table">
      <thead><tr>
        <th>Fecha</th><th>Nombre</th><th>Negocio</th><th>Contacto</th>
        <th>Mensaje</th><th>Estado</th><th>Notas</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function wireRowEvents(wrap) {
    // Cambio de estado.
    wrap.querySelectorAll('.row-status').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        await patchLead(id, { status: e.target.value }, e.target);
      });
    });
    // Guardado de notas al perder foco (si cambió).
    wrap.querySelectorAll('.row-notes').forEach((inp) => {
      inp.dataset.original = inp.value;
      inp.addEventListener('blur', async (e) => {
        if (e.target.value === e.target.dataset.original) return;
        const id = e.target.closest('tr').dataset.id;
        await patchLead(id, { notes: e.target.value }, e.target);
        e.target.dataset.original = e.target.value;
      });
    });
  }

  async function patchLead(id, patch, el) {
    el.classList.remove('saved', 'error');
    try {
      await apiFetch(`/api/leads/${id}`, { method: 'PATCH', body: patch, token });
      el.classList.add('saved'); // feedback verde breve
      setTimeout(() => el.classList.remove('saved'), 1200);
    } catch {
      el.classList.add('error');
    }
  }

  await fetchAndRender();
}
