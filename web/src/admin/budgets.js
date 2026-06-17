/**
 * Sección "Presupuestos" del panel admin (Fase 4).
 * Permite cargar presupuestos y cambiar su estado. El seguimiento automático
 * (recordatorios) lo hace el cron de Supabase, no esta pantalla.
 */
import { apiFetch } from '../lib/api.js';
import { esc, fmtDate, fmtMoney, statusSelect, downloadCsv, loadErrorMessage } from '../lib/format.js';

const BUDGET_STATUSES = ['enviado', 'sin_respuesta', 'recordado', 'ganado', 'perdido'];

export async function loadBudgets(container, token) {
  container.innerHTML = `
    <h1>Presupuestos</h1>
    <p class="panel-hint">Cotizaciones enviadas y su seguimiento.</p>

    <form id="budget-form" class="card-form">
      <div class="form-row">
        <input name="customer_name" type="text" placeholder="Cliente" required maxlength="120" />
        <input name="customer_contact" type="text" placeholder="Email o WhatsApp" required maxlength="120" />
      </div>
      <div class="form-row">
        <input name="amount" type="number" min="0" step="0.01" placeholder="Monto" />
        <input name="description" type="text" placeholder="Descripción" maxlength="1000" />
      </div>
      <button type="submit" class="auth-btn form-submit">Agregar presupuesto</button>
      <span class="form-feedback" id="budget-feedback"></span>
    </form>

    <div class="toolbar">
      <button id="budget-export" class="toolbar-btn" type="button" disabled>Exportar CSV</button>
    </div>
    <div id="budgets-status" class="panel-status"></div>
    <div id="budgets-table-wrap"></div>`;

  const form = container.querySelector('#budget-form');
  const feedback = container.querySelector('#budget-feedback');
  const exportBtn = container.querySelector('#budget-export');

  // Últimos presupuestos cargados (para exportar).
  let currentBudgets = [];
  exportBtn.addEventListener('click', () => {
    if (currentBudgets.length === 0) return;
    const columns = [
      { key: 'sent_at', label: 'Enviado' },
      { key: 'customer_name', label: 'Cliente' },
      { key: 'customer_contact', label: 'Contacto' },
      { key: 'amount', label: 'Monto' },
      { key: 'description', label: 'Descripción' },
      { key: 'followup_count', label: 'Recordatorios' },
      { key: 'status', label: 'Estado' },
    ];
    const fecha = new Date().toISOString().slice(0, 10);
    downloadCsv(`presupuestos-${fecha}.csv`, columns, currentBudgets);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = '';
    const body = {
      customer_name: form.customer_name.value.trim(),
      customer_contact: form.customer_contact.value.trim(),
      description: form.description.value.trim() || undefined,
    };
    // amount es opcional y numérico.
    const amount = form.amount.value.trim();
    if (amount) body.amount = Number(amount);

    try {
      await apiFetch('/api/budgets', { method: 'POST', body, token });
      form.reset();
      feedback.textContent = 'Agregado ✓';
      feedback.className = 'form-feedback ok';
      await fetchAndRender();
    } catch (err) {
      feedback.textContent = err.message || 'No se pudo guardar.';
      feedback.className = 'form-feedback err';
    }
  });

  async function fetchAndRender() {
    const statusEl = container.querySelector('#budgets-status');
    const wrap = container.querySelector('#budgets-table-wrap');
    statusEl.textContent = 'Cargando…';
    wrap.innerHTML = '';
    try {
      const { data } = await apiFetch('/api/budgets', { token });
      const budgets = data || [];
      currentBudgets = budgets;
      exportBtn.disabled = budgets.length === 0;
      if (budgets.length === 0) {
        statusEl.textContent = 'Todavía no hay presupuestos.';
        return;
      }
      statusEl.textContent = `${budgets.length} presupuesto(s).`;
      wrap.innerHTML = renderTable(budgets);
      wireRowEvents(wrap);
    } catch (err) {
      currentBudgets = [];
      exportBtn.disabled = true;
      statusEl.textContent = loadErrorMessage(err, 'No pudimos cargar los presupuestos.');
    }
  }

  function renderTable(budgets) {
    const rows = budgets
      .map(
        (b) => `
      <tr data-id="${b.id}">
        <td>${fmtDate(b.sent_at || b.created_at)}</td>
        <td>${esc(b.customer_name)}</td>
        <td>${esc(b.customer_contact)}</td>
        <td>${fmtMoney(b.amount)}</td>
        <td>${esc(b.description || '—')}</td>
        <td>${b.followup_count || 0}</td>
        <td><select class="row-status">${statusSelect(BUDGET_STATUSES, b.status || 'enviado')}</select></td>
      </tr>`
      )
      .join('');
    return `<table class="data-table">
      <thead><tr>
        <th>Enviado</th><th>Cliente</th><th>Contacto</th><th>Monto</th>
        <th>Descripción</th><th>Recordatorios</th><th>Estado</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function wireRowEvents(wrap) {
    wrap.querySelectorAll('.row-status').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        e.target.classList.remove('saved', 'error');
        try {
          await apiFetch(`/api/budgets/${id}`, { method: 'PATCH', body: { status: e.target.value }, token });
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
