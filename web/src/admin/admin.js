/**
 * Orquestador del panel admin.
 *
 * Responsabilidades:
 *   - Login / logout con Supabase Auth.
 *   - Mostrar la vista correcta (login vs panel) según haya sesión.
 *   - Navegación por pestañas (Leads / Presupuestos / Reseñas), delegando el
 *     render de cada sección a su módulo.
 *
 * El JWT de la sesión se pasa a cada sección, que lo manda al backend; el
 * backend verifica el token y el rol admin antes de responder.
 */
import { supabase } from '../lib/supabase.js';
import { loadSummary } from './summary.js';
import { loadLeads } from './leads.js';
import { loadBudgets } from './budgets.js';
import { loadReviews } from './reviews.js';

const loginView = document.getElementById('login-view');
const panelView = document.getElementById('panel-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const tabContent = document.getElementById('tab-content');
const tabButtons = document.querySelectorAll('.tab-btn');

// Cada pestaña asocia su loader. Todos reciben (container, token).
const TABS = {
  summary: loadSummary,
  leads: loadLeads,
  budgets: loadBudgets,
  reviews: loadReviews,
};

let currentToken = null;
let activeTab = 'summary';

/** Alterna entre login y panel; al entrar, abre la pestaña activa. */
function render(session) {
  const authed = Boolean(session);
  loginView.hidden = authed;
  panelView.hidden = !authed;
  if (authed) {
    currentToken = session.access_token;
    userEmail.textContent = session.user?.email || '';
    // Si una sección falla al renderizar, no debe frenar el cambio de vista.
    try {
      showTab(activeTab);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[admin] error al abrir la pestaña:', e);
    }
  } else {
    currentToken = null;
  }
}

/** Traduce el error de Supabase a un mensaje claro para el usuario. */
function loginErrorMessage(error) {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed'))
    return 'Tu email todavía no está confirmado en Supabase (Authentication → Users → confirmar).';
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'No pudimos conectar con Supabase. Revisá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.';
  return error?.message ? `No pudimos iniciar sesión: ${error.message}` : 'No pudimos iniciar sesión.';
}

/** Renderiza una pestaña y marca su botón como activo. */
function showTab(name) {
  activeTab = name;
  tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  const loader = TABS[name];
  if (loader) loader(tabContent, currentToken);
}

// Navegación por pestañas.
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// Login.
const submitBtn = loginForm.querySelector('button[type="submit"]');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Entrando…';
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[admin] login error:', error);
      loginError.textContent = loginErrorMessage(error);
      return;
    }
    // Éxito: movemos la UI directamente. No dependemos solo de onAuthStateChange
    // (si ese evento no dispara, igual entramos).
    if (data?.session) render(data.session);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[admin] login excepción:', err);
    loginError.textContent = loginErrorMessage(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Logout.
logoutBtn.addEventListener('click', () => supabase.auth.signOut());

// Arranque: pinta según la sesión actual y escucha cambios de auth.
supabase.auth.getSession().then(({ data }) => render(data.session));
supabase.auth.onAuthStateChange((_event, session) => render(session));
