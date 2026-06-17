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
  leads: loadLeads,
  budgets: loadBudgets,
  reviews: loadReviews,
};

let currentToken = null;
let activeTab = 'leads';

/** Alterna entre login y panel; al entrar, abre la pestaña activa. */
function render(session) {
  const authed = Boolean(session);
  loginView.hidden = authed;
  panelView.hidden = !authed;
  if (authed) {
    currentToken = session.access_token;
    userEmail.textContent = session.user.email;
    showTab(activeTab);
  } else {
    currentToken = null;
  }
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
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'No pudimos iniciar sesión. Revisá tus datos.';
  }
  // onAuthStateChange dispara render() automáticamente.
});

// Logout.
logoutBtn.addEventListener('click', () => supabase.auth.signOut());

// Arranque: pinta según la sesión actual y escucha cambios de auth.
supabase.auth.getSession().then(({ data }) => render(data.session));
supabase.auth.onAuthStateChange((_event, session) => render(session));
