/**
 * Lógica del panel admin (scaffold de la Fase 2 del CRM).
 *
 * Responsabilidades:
 *   - Login / logout con Supabase Auth (email + contraseña).
 *   - Mostrar la vista correcta según haya o no sesión.
 *   - Pedir los leads al backend enviando el JWT de la sesión; el backend
 *     verifica el token y que el usuario sea admin antes de responder.
 *
 * Nota: este archivo es un esqueleto funcional pensado para crecer
 * (filtros, cambio de estado, presupuestos, reseñas) en fases siguientes.
 */
import { supabase } from '../lib/supabase.js';
import { apiFetch } from '../lib/api.js';

const loginView = document.getElementById('login-view');
const panelView = document.getElementById('panel-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');

/** Alterna entre la vista de login y la del panel. */
function render(session) {
  const authed = Boolean(session);
  loginView.hidden = authed;
  panelView.hidden = !authed;
  if (authed) {
    userEmail.textContent = session.user.email;
    loadLeads(session.access_token);
  }
}

/** Inicia sesión con email/contraseña. */
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'No pudimos iniciar sesión. Revisá tus datos.';
  }
  // No hace falta render() acá: onAuthStateChange se dispara solo.
});

/** Cierra la sesión. */
logoutBtn.addEventListener('click', () => supabase.auth.signOut());

/** Trae los leads desde el backend usando el JWT de la sesión. */
async function loadLeads(token) {
  const statusEl = document.getElementById('leads-status');
  const table = document.getElementById('leads-table');
  const tbody = document.getElementById('leads-body');
  statusEl.textContent = 'Cargando leads…';
  table.hidden = true;

  try {
    const { data } = await apiFetch('/api/leads', { token });
    const leads = data || [];
    tbody.innerHTML = '';
    if (leads.length === 0) {
      statusEl.textContent = 'Todavía no llegaron leads.';
      return;
    }
    for (const lead of leads) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtDate(lead.created_at)}</td>
        <td>${esc(lead.name)}</td>
        <td>${esc(lead.business || '—')}</td>
        <td>${esc(lead.contact)}</td>
        <td>${esc(lead.message)}</td>
        <td><span class="badge">${esc(lead.status || 'nuevo')}</span></td>`;
      tbody.appendChild(tr);
    }
    statusEl.textContent = `${leads.length} lead(s).`;
    table.hidden = false;
  } catch (err) {
    statusEl.textContent =
      err.status === 401
        ? 'Tu sesión no tiene permisos de admin.'
        : 'No pudimos cargar los leads. Reintentá en un momento.';
  }
}

/* ----------------- helpers ----------------- */

// Escapa texto para evitar inyección de HTML al renderizar datos.
function esc(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/* Arranque: pinta según la sesión actual y escucha cambios de auth. */
supabase.auth.getSession().then(({ data }) => render(data.session));
supabase.auth.onAuthStateChange((_event, session) => render(session));
