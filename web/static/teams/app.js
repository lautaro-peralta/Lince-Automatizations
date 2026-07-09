/* =============================================================================
   Lince Teams — cliente de la sección interna (módulo ES, sin build).

   La sesión se COMPARTE con el panel /admin y el Startup OS: mismo origen,
   mismo proyecto de Supabase. Este módulo no tiene formulario de login propio;
   si no hay sesión, manda a /admin?next=/teams/ y vuelve solo. Todo lo que se
   ve sale de la API (/api/teams/*, /api/me): no hay datos simulados.

   Vistas: Panel (dashboard), Tablero (kanban) y Pizarra colaborativa. El
   "casi en vivo" se logra por sondeo ligero (no hay WebSocket en este stack).
   ========================================================================== */

const { createClient } = window.supabase || {};

/* ─── configuración pública (misma que /admin, vía /auth-config en runtime) ── */
let API_URL = '';
let supabase = null;
try {
	const cfg = await (await fetch('/auth-config')).json();
	API_URL = cfg.apiUrl || '';
	if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
		supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
	}
} catch (e) {
	/* sin config: el gate muestra el aviso con salida manual (ver abajo) */
}

/* ─── utilidades ─────────────────────────────────────────────────────────── */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const esc = (s) =>
	String(s ?? '').replace(/[&<>"']/g, (c) =>
		({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
	);

const STATUS_LABEL = { todo: 'Por hacer', doing: 'En curso', done: 'Hecho' };
const PRIORITY_LABEL = { low: 'Baja', medium: 'Media', high: 'Alta' };
const PRIORITY_BADGE = { low: 'badge-moss', medium: 'badge-neutral', high: 'badge-rust' };
const CHART_VAR = { todo: '--chart-todo', doing: '--chart-doing', done: '--chart-done' };

const NOTE_COLORS = ['#F6E7A8', '#EFEAE0', '#DCE8DF', '#F3D9C9', '#FFFFFF'];
const PEN_COLORS = ['#1B2B23', '#C9622E', '#3D5A45', '#3B7EC0'];
const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB por imagen de pizarra

function initials(name) {
	const p = (name || '').trim().split(/\s+/).filter(Boolean);
	return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] || '·').slice(0, 2)).toUpperCase();
}
function avatarHtml(name, cls = 'avatar') {
	if (!name) return '';
	return `<span class="${cls}" title="${esc(name)}">${esc(initials(name))}</span>`;
}
function parseTs(ts) {
	const s = String(ts);
	if (/[zZ]$|[+-]\d\d:?\d\d$/.test(s)) return new Date(s);
	return new Date(s.replace(' ', 'T') + 'Z');
}
function timeAgo(iso) {
	const secs = (Date.now() - parseTs(iso).getTime()) / 1000;
	if (secs < 60) return 'ahora';
	if (secs < 3600) return `hace ${Math.floor(secs / 60)} min`;
	if (secs < 86400) return `hace ${Math.floor(secs / 3600)} h`;
	return `hace ${Math.floor(secs / 86400)} d`;
}
const todayISO = () => new Date().toISOString().slice(0, 10);

function toast(msg, kind = '') {
	const el = document.createElement('div');
	el.className = `toast ${kind}`;
	el.textContent = msg;
	$('#toast-root').appendChild(el);
	setTimeout(() => el.remove(), 3500);
}

/* ─── cliente HTTP (adjunta el JWT de la sesión de Supabase) ─────────────────── */
async function api(path, { method = 'GET', body } = {}) {
	const { data: { session } } = await supabase.auth.getSession();
	const headers = {};
	if (body !== undefined) headers['Content-Type'] = 'application/json';
	if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
	const res = await fetch(`${API_URL}${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	let data = null;
	try { data = text ? JSON.parse(text) : null; } catch (e) { data = { message: text }; }
	if (!res.ok) {
		const err = new Error((data && data.message) || `Error ${res.status}`);
		err.status = res.status;
		throw err;
	}
	return data;
}
const unwrap = (r) => (r && r.data !== undefined ? r.data : r);
const apiGet = (p) => api(p).then(unwrap);
const apiPost = (p, body) => api(p, { method: 'POST', body }).then(unwrap);
const apiPatch = (p, body) => api(p, { method: 'PATCH', body }).then(unwrap);
const apiDelete = (p) => api(p, { method: 'DELETE' }).then(unwrap);

/* ─── tema (mismo mecanismo que el sitio: data-theme + lince-theme) ────────── */
function syncThemeIcon() {
	const dark = document.documentElement.getAttribute('data-theme') === 'dark';
	$$('.theme-ico').forEach((u) => u.setAttribute('href', dark ? '#i-sun' : '#i-moon'));
}
$('#theme-toggle').addEventListener('click', () => {
	const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
	document.documentElement.setAttribute('data-theme', next);
	try { localStorage.setItem('lince-theme', next); } catch (e) {}
	syncThemeIcon();
});
syncThemeIcon();

/* ─── estado ──────────────────────────────────────────────────────────────── */
const state = {
	me: null,        // { id, email, full_name, role }
	users: [],       // socios/admins (de /api/me/partners) — para asignar tareas
	view: 'dashboard',
	renderSeq: 0,    // evita que un render async viejo pise una vista nueva
	dragging: false, // hay un arrastre de tarjeta en curso (no refrescar tablero)
	wb: null,        // runtime de la pizarra mientras esa vista está montada
	dashMine: [],    // tareas "mías" del panel (para abrir el modal al hacer clic)
};

const gate = $('#gate');
const appEl = $('#app');
const gateSub = $('#gate-sub');
const gateLoginLink = $('#gate-login-link');

function goToLogin() {
	location.replace('/admin?next=' + encodeURIComponent(location.pathname));
}
function showChecking(msg) {
	appEl.hidden = true;
	gate.hidden = false;
	if (msg) gateSub.textContent = msg;
}
function showApp() {
	gate.hidden = true;
	appEl.hidden = false;
}

/* ─── arranque de sesión ────────────────────────────────────────────────────── */
async function loadSession() {
	state.me = await apiGet('/api/me');
	state.users = (await apiGet('/api/me/partners')) || [];
	$('#me-name').textContent = (state.me.full_name || state.me.email || '').split(/\s+/)[0] || '';
	$('#me-avatar').textContent = initials(state.me.full_name || state.me.email);
	$('#go-admin-link').hidden = state.me.role !== 'admin';
}

if (!supabase) {
	showChecking('No se pudo cargar la configuración de acceso. Reintentá en un momento.');
	gateLoginLink.hidden = false;
} else {
	let sessionLoading = false;
	async function handleAuth(session) {
		if (!session) {
			state.me = null;
			goToLogin();
			return;
		}
		if (!appEl.hidden || sessionLoading) return;
		sessionLoading = true;
		try {
			await loadSession();
		} catch (e) {
			if (e.status === 403) {
				showChecking('Tu cuenta no tiene acceso a Lince Teams.');
				gateLoginLink.textContent = 'Ir al panel';
				gateLoginLink.setAttribute('href', '/admin');
				gateLoginLink.hidden = false;
			} else {
				showChecking('No se pudo cargar tu sesión. Reintentá en un momento.');
				gateLoginLink.hidden = false;
			}
			return;
		} finally {
			sessionLoading = false;
		}
		showApp();
		showView(state.view);
		startBackgroundSync();
		toast('Hola, ' + ((state.me.full_name || state.me.email || '').split(/\s+/)[0] || '') + '.', 'ok');
	}

	// El trabajo se difiere con setTimeout: supabase-js espera a que vuelvan
	// los callbacks de onAuthStateChange antes de resolver getSession().
	supabase.auth.onAuthStateChange((_event, session) => {
		setTimeout(() => handleAuth(session), 0);
	});
}

$('#btn-logout').addEventListener('click', async () => {
	if (supabase) await supabase.auth.signOut();
	goToLogin();
});

/* ─── navegación entre vistas ───────────────────────────────────────────────── */
const VIEWS = {
	dashboard: renderDashboard,
	board: renderBoard,
	whiteboard: renderWhiteboard,
};

function showView(view) {
	if (state.view === 'whiteboard' && view !== 'whiteboard' && state.wb) {
		clearInterval(state.wb.timer);
		state.wb = null;
	}
	state.view = view;
	$$('.nav-item').forEach((b) => {
		b.classList.toggle('active', b.dataset.view === view);
		b.setAttribute('aria-selected', b.dataset.view === view);
	});
	VIEWS[view]();
}

$$('.nav-item').forEach((b) => (b.onclick = () => showView(b.dataset.view)));

/* Sondeo de fondo: mantiene panel y tablero al día con lo que hacen otros
   socios. Se salta si hay un modal abierto, un arrastre en curso o la pestaña
   está oculta, para no interrumpir. La pizarra tiene su propio sondeo (rápido
   e incremental) montado en su vista. */
let bgTimer = null;
function startBackgroundSync() {
	clearInterval(bgTimer);
	bgTimer = setInterval(() => {
		if (document.hidden) return;
		if ($('#modal-root').children.length) return;
		if (state.dragging) return;
		if (state.view === 'dashboard') renderDashboard();
		else if (state.view === 'board') renderBoard();
	}, 6000);
}

/* ─── panel ─────────────────────────────────────────────────────────────────── */
async function renderDashboard() {
	const seq = ++state.renderSeq;
	const d = await apiGet('/api/teams/dashboard');
	if (seq !== state.renderSeq || state.view !== 'dashboard') return;
	state.dashMine = d.mine || [];
	const total = d.counts.todo + d.counts.doing + d.counts.done;
	const today = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
	const maxLoad = Math.max(1, ...d.per_user.map((u) => u.open));

	$('#main').innerHTML = `<div class="view">
		<div class="view-head">
			<div>
				<h2>Hola, ${esc(state.me.full_name || state.me.email)}.</h2>
				<div class="view-sub">${esc(today)} — ${total} tarea${total === 1 ? '' : 's'} en total</div>
			</div>
			<button class="btn-primary" id="dash-new-task">+ Nueva tarea</button>
		</div>
		<div class="stat-grid">
			${stat(d.counts.todo, 'Por hacer')}
			${stat(d.counts.doing, 'En curso')}
			${stat(d.counts.done, 'Hechas')}
			${stat(d.per_user.length, 'Miembros')}
		</div>
		<div class="chart-grid">
			<div class="panel-card">
				<h3>Estado de las tareas</h3>
				${donutChart(d.counts, total)}
			</div>
			<div class="panel-card">
				<h3>Completadas — últimos 14 días</h3>
				${barsChart(d.done_by_day)}
			</div>
		</div>
		<div class="dash-cols">
			<div>
				<div class="panel-card">
					<h3>Mis tareas pendientes</h3>
					${d.mine.length ? d.mine.map(miniTask).join('') : `<div class="empty">Nada pendiente.</div>`}
				</div>
			</div>
			<div>
				<div class="panel-card">
					<h3>Carga del equipo</h3>
					${d.per_user.length ? d.per_user.map((u) => `
						<div class="load-row">
							<span class="name">${esc(u.name)}</span>
							<div class="track"><div class="fill" style="width:${(u.open / maxLoad) * 100}%"></div></div>
							<span class="n meta">${u.open}</span>
						</div>`).join('') : `<div class="empty">Sin miembros aún.</div>`}
				</div>
				<div class="panel-card">
					<h3>Actividad reciente</h3>
					${d.activity.length ? d.activity.map((a) => `
						<div class="feed-item"><span>${esc(a.text)}</span><span class="when meta">${timeAgo(a.created_at)}</span></div>
					`).join('') : `<div class="empty">Todavía no hay actividad.</div>`}
				</div>
			</div>
		</div>
	</div>`;

	$('#dash-new-task').onclick = () => taskModal();
	$$('.mini-task[data-id]').forEach((el) =>
		(el.onclick = () => {
			const t = state.dashMine.find((x) => String(x.id) === el.dataset.id);
			if (t) taskModal(t);
		})
	);

	function stat(num, label) {
		return `<div class="panel-card stat"><span class="label">${esc(label)}</span><div class="num">${num}</div></div>`;
	}
	function miniTask(t) {
		const due = t.due_date ? ` · vence ${t.due_date}` : '';
		return `<div class="mini-task" data-id="${t.id}">
			<span class="badge ${PRIORITY_BADGE[t.priority]}">${PRIORITY_LABEL[t.priority]}</span>
			<span class="t">${esc(t.title)}</span>
			<span class="meta">${STATUS_LABEL[t.status]}${esc(due)}</span>
		</div>`;
	}
}

/* Dona de estados: color validado + leyenda con etiqueta y valor (nunca color
   solo). Hueco de 2.5px entre segmentos. */
function donutChart(counts, total) {
	if (!total) return `<div class="empty">Aún no hay tareas.</div>`;
	const R = 54, C = 2 * Math.PI * R, GAP = 2.5;
	const order = ['done', 'doing', 'todo'];
	let offset = C / 4;
	const segs = order.filter((k) => counts[k] > 0).map((k) => {
		const frac = counts[k] / total;
		const len = Math.max(frac * C - GAP, 1);
		const seg = `<circle r="${R}" cx="70" cy="70" fill="none"
			style="stroke:var(${CHART_VAR[k]})" stroke-width="18"
			stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${offset}">
			<title>${STATUS_LABEL[k]}: ${counts[k]}</title></circle>`;
		offset -= frac * C;
		return seg;
	}).join('');
	const legend = order.map((k) => `
		<div class="legend-item">
			<span class="dot" style="background:var(${CHART_VAR[k]})"></span>
			${STATUS_LABEL[k]} <span class="meta">${counts[k]} · ${Math.round((counts[k] / total) * 100)}%</span>
		</div>`).join('');
	return `<div class="donut-row">
		<svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Distribución de tareas por estado">
			${segs}
			<text x="70" y="66" text-anchor="middle" style="font-family:var(--display);font-size:30px;fill:var(--ink)">${total}</text>
			<text x="70" y="86" text-anchor="middle" style="font-family:var(--mono);font-size:9px;letter-spacing:.07em;fill:var(--sage)">TAREAS</text>
		</svg>
		<div class="donut-legend">${legend}</div>
	</div>`;
}

/* Magnitud en el tiempo: un solo tono, sin leyenda; valor exacto en hover. */
function barsChart(days) {
	const max = Math.max(1, ...days.map((d) => d.n));
	const peak = days.reduce((a, b) => (b.n > a.n ? b : a), days[0]);
	const bars = days.map((d) => {
		const label = new Date(d.day + 'T00:00:00Z').toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
		return `<div class="bar-col" title="${esc(label)}: ${d.n} completada${d.n === 1 ? '' : 's'}">
			<div class="bar ${d.n === 0 ? 'zero' : ''}" style="height:${d.n === 0 ? 2 : Math.max(6, (d.n / max) * 100)}%"></div>
		</div>`;
	}).join('');
	const labels = days.map((d, i) => {
		const show = i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2);
		const label = new Date(d.day + 'T00:00:00Z').toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
		return `<span>${show ? esc(label) : ''}</span>`;
	}).join('');
	const note = peak && peak.n > 0
		? `<div class="meta" style="margin-top:8px">Pico: ${peak.n} el ${new Date(peak.day + 'T00:00:00Z').toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</div>`
		: `<div class="empty">Sin tareas completadas en este periodo.</div>`;
	return `<div class="bars14">${bars}</div><div class="bars-labels">${labels}</div>${note}`;
}

/* ─── tablero kanban ───────────────────────────────────────────────────────── */
async function renderBoard() {
	const seq = ++state.renderSeq;
	const tasks = await apiGet('/api/teams/tasks');
	if (seq !== state.renderSeq || state.view !== 'board') return;
	$('#main').innerHTML = `<div class="view">
		<div class="view-head">
			<div><h2>Tablero</h2><div class="view-sub">Arrastra las tarjetas entre columnas; haz clic para editar o asignar</div></div>
			<button class="btn-primary" id="board-new-task">+ Nueva tarea</button>
		</div>
		<div class="board">
			${['todo', 'doing', 'done'].map((s) => column(s, tasks.filter((t) => t.status === s))).join('')}
		</div>
	</div>`;

	$('#board-new-task').onclick = () => taskModal();

	$$('.task-card').forEach((card) => {
		card.onclick = () => taskModal(tasks.find((t) => String(t.id) === card.dataset.id));
		card.ondragstart = (e) => {
			state.dragging = true;
			e.dataTransfer.setData('text/plain', card.dataset.id);
			card.classList.add('dragging');
		};
		card.ondragend = () => {
			state.dragging = false;
			card.classList.remove('dragging');
		};
	});

	$$('.col').forEach((col) => {
		col.ondragover = (e) => { e.preventDefault(); col.classList.add('drag-over'); };
		col.ondragleave = () => col.classList.remove('drag-over');
		col.ondrop = async (e) => {
			e.preventDefault();
			col.classList.remove('drag-over');
			state.dragging = false;
			const id = e.dataTransfer.getData('text/plain');
			const task = tasks.find((t) => String(t.id) === id);
			if (!task || task.status === col.dataset.status) return;
			try {
				await apiPatch(`/api/teams/tasks/${id}`, { status: col.dataset.status });
				renderBoard();
			} catch (err) { toast(err.message, 'error'); }
		};
	});

	function column(status, items) {
		return `
		<div class="col" data-status="${status}">
			<div class="col-head">
				<span class="label">${STATUS_LABEL[status]}</span>
				<span class="count meta">${items.length}</span>
			</div>
			${items.map(taskCard).join('') || `<div class="empty">Vacío</div>`}
		</div>`;
	}
	function taskCard(t) {
		const late = t.due_date && t.status !== 'done' && t.due_date < todayISO();
		return `
		<div class="task-card" draggable="true" data-id="${t.id}">
			<div class="title">${esc(t.title)}</div>
			${t.description ? `<div class="desc">${esc(t.description)}</div>` : ''}
			<div class="task-foot">
				<span class="badge ${PRIORITY_BADGE[t.priority]}">${PRIORITY_LABEL[t.priority]}</span>
				${t.due_date ? `<span class="due ${late ? 'late' : ''}">${late ? 'VENCIDA ' : ''}${t.due_date}</span>` : ''}
				${avatarHtml(t.assignee_name)}
			</div>
		</div>`;
	}
}

/* ─── modal de tarea ───────────────────────────────────────────────────────── */
function taskModal(task = null) {
	const isEdit = !!task;
	$('#modal-root').innerHTML = `
	<div class="modal-overlay" id="modal-overlay">
		<div class="modal">
			<h3>${isEdit ? 'Editar tarea' : 'Nueva tarea'}</h3>
			<div class="field"><label class="field-label">Título</label>
				<input id="m-title" class="field-input" value="${esc(task?.title || '')}" placeholder="¿Qué hay que hacer?"></div>
			<div class="field"><label class="field-label">Descripción</label>
				<textarea id="m-desc" class="field-textarea" rows="3">${esc(task?.description || '')}</textarea></div>
			<div class="row2">
				<div class="field"><label class="field-label">Estado</label>
					<select id="m-status" class="field-select">${Object.entries(STATUS_LABEL).map(([v, l]) =>
						`<option value="${v}" ${task?.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
				</div>
				<div class="field"><label class="field-label">Prioridad</label>
					<select id="m-priority" class="field-select">${Object.entries(PRIORITY_LABEL).map(([v, l]) =>
						`<option value="${v}" ${(task?.priority || 'medium') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
				</div>
			</div>
			<div class="row2">
				<div class="field"><label class="field-label">Asignada a</label>
					<select id="m-assignee" class="field-select">
						<option value="">Sin asignar</option>
						${state.users.map((u) => `<option value="${u.id}" ${task?.assignee_id === u.id ? 'selected' : ''}>${esc(u.full_name)}</option>`).join('')}
					</select>
				</div>
				<div class="field"><label class="field-label">Fecha límite</label>
					<input id="m-due" class="field-input" type="date" value="${task?.due_date || ''}"></div>
			</div>
			<div class="modal-actions">
				${isEdit ? `<button class="btn-ghost btn-small btn-danger" id="m-delete">Eliminar</button>` : ''}
				<div class="spacer"></div>
				<button class="btn-ghost" id="m-cancel">Cancelar</button>
				<button class="btn-primary" id="m-save">${isEdit ? 'Guardar' : 'Crear'}</button>
			</div>
		</div>
	</div>`;

	const close = () => ($('#modal-root').innerHTML = '');
	$('#modal-overlay').onclick = (e) => { if (e.target.id === 'modal-overlay') close(); };
	$('#m-cancel').onclick = close;
	$('#m-title').focus();

	$('#m-save').onclick = async () => {
		const body = {
			title: $('#m-title').value,
			description: $('#m-desc').value,
			status: $('#m-status').value,
			priority: $('#m-priority').value,
			assignee_id: $('#m-assignee').value || null,
			due_date: $('#m-due').value || null,
		};
		try {
			if (isEdit) await apiPatch(`/api/teams/tasks/${task.id}`, body);
			else await apiPost('/api/teams/tasks', body);
			close();
			toast(isEdit ? 'Tarea guardada' : 'Tarea creada', 'ok');
			showView(state.view);
		} catch (err) { toast(err.message, 'error'); }
	};

	if (isEdit) $('#m-delete').onclick = async () => {
		try {
			await apiDelete(`/api/teams/tasks/${task.id}`);
			close();
			toast('Tarea eliminada', 'ok');
			showView(state.view);
		} catch (err) { toast(err.message, 'error'); }
	};
}

/* ─── pizarra colaborativa ─────────────────────────────────────────────────── */
async function renderWhiteboard() {
	const seq = ++state.renderSeq;
	const board = await apiGet('/api/teams/board');
	if (seq !== state.renderSeq || state.view !== 'whiteboard') return;

	$('#main').innerHTML = `<div class="view">
		<div class="view-head">
			<div><h2>Pizarra</h2>
			<div class="view-sub">Notas, dibujos e imágenes compartidos — los cambios de tus compañeros aparecen solos</div></div>
		</div>
		<div class="panel-card wb-toolbar">
			<button class="wb-tool active" data-mode="move">Mover</button>
			<button class="wb-tool" data-mode="note">Nota</button>
			<button class="wb-tool" data-mode="draw">Dibujar</button>
			<button class="wb-tool" data-mode="image">Imagen</button>
			<button class="wb-tool" data-mode="erase">Borrar</button>
			<span class="wb-sep"></span>
			<span id="wb-swatches"></span>
			<span class="wb-hint meta" id="wb-hint">Haz clic en una herramienta</span>
			<span class="wb-live meta"><span class="pulse"></span>en vivo</span>
			<input type="file" id="wb-file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden">
		</div>
		<div class="wb-wrap" id="wb-wrap">
			<div class="wb-canvas mode-move" id="wb-canvas">
				<svg id="wb-svg" xmlns="http://www.w3.org/2000/svg"></svg>
			</div>
		</div>
	</div>`;

	const wb = {
		mode: 'move',
		noteColor: NOTE_COLORS[0],
		penColor: PEN_COLORS[0],
		items: new Map(),
		drawing: null,
		activeId: null,          // id que estoy arrastrando/editando (no pisar en sync)
		lastSync: board.serverTime,
		timer: null,
	};
	state.wb = wb;
	const canvas = $('#wb-canvas');
	const svg = $('#wb-svg');

	const HINTS = {
		move: 'Arrastra notas e imágenes; doble clic en una nota para editarla',
		note: 'Haz clic donde quieras crear la nota',
		draw: 'Dibuja manteniendo pulsado el ratón',
		image: 'Elige una imagen para subirla a la pizarra',
		erase: 'Haz clic sobre un elemento para borrarlo',
	};

	function setMode(mode) {
		wb.mode = mode;
		canvas.className = `wb-canvas mode-${mode}`;
		$$('.wb-tool').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
		$('#wb-hint').textContent = HINTS[mode];
		renderSwatches();
		if (mode === 'image') $('#wb-file').click();
	}
	function renderSwatches() {
		const list = wb.mode === 'draw' ? PEN_COLORS : NOTE_COLORS;
		const current = wb.mode === 'draw' ? wb.penColor : wb.noteColor;
		$('#wb-swatches').innerHTML = list.map((c) =>
			`<button class="wb-swatch ${c === current ? 'active' : ''}" style="background:${c}" data-c="${c}" title="${c}"></button>`
		).join('');
		$$('.wb-swatch').forEach((s) => (s.onclick = () => {
			if (wb.mode === 'draw') wb.penColor = s.dataset.c;
			else wb.noteColor = s.dataset.c;
			renderSwatches();
		}));
	}
	$$('.wb-tool').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
	renderSwatches();
	$('#wb-hint').textContent = HINTS.move;

	const canvasPoint = (e) => {
		const r = canvas.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	};

	function removeNode(id) {
		const old = canvas.querySelector(`[data-id="${id}"]`) || svg.querySelector(`[data-id="${id}"]`);
		if (old) old.remove();
	}

	function renderItem(item) {
		wb.items.set(item.id, item);
		removeNode(item.id);
		if (item.kind === 'stroke') {
			const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			pl.setAttribute('points', JSON.parse(item.content || '[]').map((p) => p.join(',')).join(' '));
			pl.setAttribute('style', `stroke:${item.color || 'var(--ink)'}`);
			pl.dataset.id = item.id;
			pl.addEventListener('pointerdown', (e) => {
				if (wb.mode === 'erase') { e.stopPropagation(); deleteItem(item.id); }
			});
			svg.appendChild(pl);
			return;
		}
		let node;
		if (item.kind === 'note') {
			node = document.createElement('div');
			node.className = 'wb-note';
			node.style.background = item.color || NOTE_COLORS[0];
			node.innerHTML = `<div class="wb-note-text"></div><span class="wb-author"></span>`;
			$('.wb-note-text', node).textContent = item.content;
			$('.wb-author', node).textContent = item.author || '';
			node.ondblclick = () => {
				if (wb.mode !== 'move') return;
				const t = $('.wb-note-text', node);
				t.contentEditable = 'plaintext-only';
				t.focus();
				wb.activeId = item.id;
				t.onblur = async () => {
					t.contentEditable = 'false';
					wb.activeId = null;
					const content = t.textContent;
					if (content !== item.content) {
						try {
							const updated = await apiPatch(`/api/teams/board/${item.id}`, { content });
							wb.items.set(item.id, updated);
							item.content = content;
						} catch (err) { toast(err.message, 'error'); }
					}
				};
			};
		} else if (item.kind === 'image') {
			node = document.createElement('img');
			node.className = 'wb-img';
			node.src = item.content;
			node.draggable = false;
			if (item.w) node.style.width = item.w + 'px';
		} else return;

		node.style.left = item.x + 'px';
		node.style.top = item.y + 'px';
		node.dataset.id = item.id;
		node.addEventListener('pointerdown', (e) => itemPointerDown(e, item.id, node));
		canvas.appendChild(node);
	}

	async function deleteItem(id) {
		try { await apiDelete(`/api/teams/board/${id}`); wb.items.delete(id); removeNode(id); }
		catch (err) { toast(err.message, 'error'); }
	}

	function itemPointerDown(e, id, node) {
		if (wb.mode === 'erase') { e.stopPropagation(); deleteItem(id); return; }
		if (wb.mode !== 'move') return;
		if (e.target.isContentEditable) return;
		e.preventDefault(); e.stopPropagation();
		wb.activeId = id;
		const start = canvasPoint(e);
		const origin = { x: parseFloat(node.style.left), y: parseFloat(node.style.top) };
		let moved = false;
		const onMove = (ev) => {
			const p = canvasPoint(ev);
			const nx = Math.max(0, origin.x + p.x - start.x);
			const ny = Math.max(0, origin.y + p.y - start.y);
			if (Math.abs(p.x - start.x) + Math.abs(p.y - start.y) > 3) moved = true;
			node.style.left = nx + 'px';
			node.style.top = ny + 'px';
		};
		const onUp = async () => {
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			const x = parseFloat(node.style.left), y = parseFloat(node.style.top);
			if (!moved) { wb.activeId = null; return; }
			try {
				const updated = await apiPatch(`/api/teams/board/${id}`, { x, y });
				wb.items.set(id, updated);
			} catch (err) { toast(err.message, 'error'); }
			finally { wb.activeId = null; }
		};
		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
	}

	canvas.addEventListener('pointerdown', async (e) => {
		if (e.target !== canvas && e.target !== svg) return;
		const p = canvasPoint(e);
		if (wb.mode === 'note') {
			try {
				const item = await apiPost('/api/teams/board', { kind: 'note', x: p.x, y: p.y, color: wb.noteColor, content: '' });
				renderItem(item);
				setMode('move');
				const node = canvas.querySelector(`[data-id="${item.id}"]`);
				if (node) node.dispatchEvent(new Event('dblclick'));
			} catch (err) { toast(err.message, 'error'); }
			return;
		}
		if (wb.mode === 'draw') {
			const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			pl.setAttribute('style', `stroke:${wb.penColor}`);
			svg.appendChild(pl);
			wb.drawing = { points: [[Math.round(p.x), Math.round(p.y)]], node: pl };
			canvas.setPointerCapture(e.pointerId);
		}
	});

	canvas.addEventListener('pointermove', (e) => {
		if (!wb.drawing) return;
		const p = canvasPoint(e);
		const pts = wb.drawing.points;
		const last = pts[pts.length - 1];
		if (Math.abs(p.x - last[0]) + Math.abs(p.y - last[1]) < 3) return;
		pts.push([Math.round(p.x), Math.round(p.y)]);
		wb.drawing.node.setAttribute('points', pts.map((q) => q.join(',')).join(' '));
	});

	canvas.addEventListener('pointerup', async () => {
		if (!wb.drawing) return;
		const { points, node } = wb.drawing;
		wb.drawing = null;
		if (points.length < 2) { node.remove(); return; }
		try {
			const item = await apiPost('/api/teams/board', { kind: 'stroke', color: wb.penColor, content: JSON.stringify(points) });
			node.remove();
			renderItem(item);
		} catch (err) { node.remove(); toast(err.message, 'error'); }
	});

	$('#wb-file').onchange = (e) => {
		const file = e.target.files[0];
		e.target.value = '';
		setMode('move');
		if (!file) return;
		if (file.size > MAX_IMAGE_BYTES) { toast('Imagen demasiado grande (máx. 1 MB).', 'error'); return; }
		const reader = new FileReader();
		reader.onload = async () => {
			try {
				const wrap = $('#wb-wrap');
				const item = await apiPost('/api/teams/board', {
					kind: 'image', content: reader.result, w: 360,
					x: wrap.scrollLeft + 80, y: wrap.scrollTop + 80,
				});
				renderItem(item);
				toast('Imagen añadida', 'ok');
			} catch (err) { toast(err.message, 'error'); }
		};
		reader.readAsDataURL(file);
	};

	board.items.forEach(renderItem);

	// Sondeo incremental: trae solo lo que cambió desde `lastSync` y aplica altas,
	// ediciones y bajas sin pisar lo que este socio está tocando ahora mismo.
	wb.timer = setInterval(async () => {
		if (state.view !== 'whiteboard' || state.wb !== wb) { clearInterval(wb.timer); return; }
		if (document.hidden) return;
		let res;
		try { res = await apiGet('/api/teams/board?since=' + encodeURIComponent(wb.lastSync)); }
		catch (e) { return; }
		if (state.wb !== wb) return;
		const liveIds = new Set(res.ids);
		for (const id of [...wb.items.keys()]) {
			if (!liveIds.has(id) && id !== wb.activeId) { wb.items.delete(id); removeNode(id); }
		}
		for (const item of res.items) {
			if (item.id === wb.activeId) continue; // lo estoy moviendo/editando yo
			const editingHere = document.activeElement?.isContentEditable &&
				document.activeElement.closest(`[data-id="${item.id}"]`);
			if (editingHere) continue;
			renderItem(item);
		}
		wb.lastSync = res.serverTime;
	}, 2500);
}
