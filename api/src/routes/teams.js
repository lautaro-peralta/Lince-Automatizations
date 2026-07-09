/**
 * Rutas de LINCE TEAMS — el espacio de trabajo del equipo dentro de la app.
 *
 * Comparte el login del panel/Startup OS (Supabase Auth + rol 'socio'/'admin'):
 * el frontend estático de `/teams/` manda el mismo JWT y `requireSocio` valida.
 * Los "miembros" del equipo son los `profiles` con rol socio o admin; no hay un
 * padrón aparte.
 *
 *   GET    /api/teams/dashboard          -> agregado del panel (contadores,
 *                                           carga por miembro, mis pendientes,
 *                                           completadas por día, actividad).
 *   GET    /api/teams/tasks              -> tablero kanban (todas las tareas).
 *   POST   /api/teams/tasks              -> crear tarea.
 *   PATCH  /api/teams/tasks/:id          -> editar/mover/asignar una tarea.
 *   DELETE /api/teams/tasks/:id          -> borrar una tarea.
 *   GET    /api/teams/board[?since=ISO]  -> pizarra. Sin `since`, todo; con
 *                                           `since`, solo lo cambiado + la lista
 *                                           de ids vigentes (para detectar bajas).
 *   POST   /api/teams/board              -> crear elemento (nota/trazo/imagen).
 *   PATCH  /api/teams/board/:id          -> mover/editar un elemento.
 *   DELETE /api/teams/board/:id          -> borrar un elemento.
 *
 * Convención de respuesta: todo va envuelto en `{ data: ... }`, como el resto
 * del backend. Toda la lógica de negocio (contadores, orden, actividad) se
 * calcula acá para que el navegador nunca duplique reglas.
 */
import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { TASK_STATUSES, TASK_PRIORITIES, BOARD_KINDS } from '../constants.js';

const router = Router();

// Data URL de imagen embebida en la pizarra: acota el tamaño para no inflar la
// base ni las respuestas del sondeo (≈1 MB de imagen -> ~1.4 MB en base64).
const MAX_BOARD_CONTENT = 1_500_000;

/* ─── helpers ──────────────────────────────────────────────────────────────── */

/** Mapa id -> full_name de los miembros (perfiles socio/admin) del equipo. */
async function membersMap() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .in('role', ['socio', 'admin'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  const byId = new Map((data || []).map((p) => [p.id, p]));
  return { members: data || [], byId };
}

/** Agrega assignee_name/creator_name a una tarea desde el mapa de miembros. */
function withNames(task, byId) {
  return {
    ...task,
    assignee_name: task.assignee_id ? byId.get(task.assignee_id)?.full_name || null : null,
    creator_name: task.creator_id ? byId.get(task.creator_id)?.full_name || null : null,
  };
}

/** Registra un evento en la bitácora del equipo (nunca rompe el flujo). */
async function logActivity(actorId, text) {
  try {
    await supabase.from('team_activity').insert({ actor: actorId, text });
  } catch {
    /* la bitácora es best-effort: si falla, la acción principal ya se hizo */
  }
}

async function getTask(id, byId) {
  const { data, error } = await supabase.from('team_tasks').select('*').eq('id', id).single();
  if (error || !data) return null;
  return withNames(data, byId || (await membersMap()).byId);
}

/* ─── tablero kanban ───────────────────────────────────────────────────────── */

// GET /api/teams/tasks
router.get('/tasks', requireSocio, async (_req, res, next) => {
  try {
    const { byId } = await membersMap();
    const { data, error } = await supabase
      .from('team_tasks')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json({ data: (data || []).map((t) => withNames(t, byId)) });
  } catch (err) {
    next(err);
  }
});

// POST /api/teams/tasks
router.post('/tasks', requireSocio, async (req, res, next) => {
  try {
    const title = (req.body?.title || '').trim();
    if (!title) return res.status(400).json({ message: 'La tarea necesita un título.' });
    const status = req.body?.status ?? 'todo';
    const priority = req.body?.priority ?? 'medium';
    if (!TASK_STATUSES.includes(status) || !TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Estado o prioridad inválidos.' });
    }
    const insert = {
      title,
      description: (req.body?.description || '').toString(),
      status,
      priority,
      assignee_id: req.body?.assignee_id || null,
      creator_id: req.profile.id,
      due_date: req.body?.due_date || null,
    };
    const { data, error } = await supabase.from('team_tasks').insert(insert).select('*').single();
    if (error) throw error;
    const { byId } = await membersMap();
    const task = withNames(data, byId);
    if (task.assignee_name && task.assignee_id !== req.profile.id) {
      await logActivity(req.profile.id, `${req.profile.full_name} asignó «${task.title}» a ${task.assignee_name}`);
    } else {
      await logActivity(req.profile.id, `${req.profile.full_name} creó la tarea «${task.title}»`);
    }
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teams/tasks/:id
router.patch('/tasks/:id', requireSocio, async (req, res, next) => {
  try {
    const { data: prev, error: prevErr } = await supabase
      .from('team_tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (prevErr || !prev) return res.status(404).json({ message: 'Tarea no encontrada.' });

    const changes = {};
    const b = req.body || {};
    if (b.title !== undefined) {
      const title = (b.title || '').trim();
      if (!title) return res.status(400).json({ message: 'La tarea necesita un título.' });
      changes.title = title;
    }
    if (b.description !== undefined) changes.description = (b.description || '').toString();
    if (b.status !== undefined) {
      if (!TASK_STATUSES.includes(b.status)) return res.status(400).json({ message: 'Estado inválido.' });
      changes.status = b.status;
    }
    if (b.priority !== undefined) {
      if (!TASK_PRIORITIES.includes(b.priority)) return res.status(400).json({ message: 'Prioridad inválida.' });
      changes.priority = b.priority;
    }
    if (b.assignee_id !== undefined) changes.assignee_id = b.assignee_id || null;
    if (b.due_date !== undefined) changes.due_date = b.due_date || null;

    if (Object.keys(changes).length === 0) {
      return res.json({ data: await getTask(req.params.id) });
    }
    changes.updated_at = new Date().toISOString();
    const { error } = await supabase.from('team_tasks').update(changes).eq('id', req.params.id);
    if (error) throw error;

    const { byId } = await membersMap();
    const task = await getTask(req.params.id, byId);
    if (changes.status === 'done' && prev.status !== 'done') {
      await logActivity(req.profile.id, `${req.profile.full_name} completó «${task.title}»`);
    } else if (changes.assignee_id && task.assignee_name && changes.assignee_id !== req.profile.id) {
      await logActivity(req.profile.id, `${req.profile.full_name} asignó «${task.title}» a ${task.assignee_name}`);
    } else {
      await logActivity(req.profile.id, `${req.profile.full_name} actualizó «${task.title}»`);
    }
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/tasks/:id
router.delete('/tasks/:id', requireSocio, async (req, res, next) => {
  try {
    const { data: prev } = await supabase.from('team_tasks').select('*').eq('id', req.params.id).single();
    if (!prev) return res.status(404).json({ message: 'Tarea no encontrada.' });
    const { error } = await supabase.from('team_tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    await logActivity(req.profile.id, `${req.profile.full_name} eliminó «${prev.title}»`);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

/* ─── pizarra colaborativa ─────────────────────────────────────────────────── */

async function boardItemWithAuthor(id, byId) {
  const { data, error } = await supabase.from('team_board_items').select('*').eq('id', id).single();
  if (error || !data) return null;
  return { ...data, author: data.created_by ? byId.get(data.created_by)?.full_name || null : null };
}

// GET /api/teams/board  (?since=ISO -> incremental)
router.get('/board', requireSocio, async (req, res, next) => {
  try {
    const since = req.query.since;
    const now = new Date().toISOString();
    const { byId } = await membersMap();

    if (since) {
      // Solo lo cambiado desde `since`, más los ids vigentes para que el cliente
      // detecte lo borrado sin traer toda la pizarra en cada sondeo.
      const [changedQ, idsQ] = await Promise.all([
        supabase.from('team_board_items').select('*').gt('updated_at', since).order('z').order('id'),
        supabase.from('team_board_items').select('id'),
      ]);
      if (changedQ.error) throw changedQ.error;
      if (idsQ.error) throw idsQ.error;
      const items = (changedQ.data || []).map((it) => ({
        ...it,
        author: it.created_by ? byId.get(it.created_by)?.full_name || null : null,
      }));
      return res.json({ data: { items, ids: (idsQ.data || []).map((r) => r.id), serverTime: now } });
    }

    const { data, error } = await supabase
      .from('team_board_items')
      .select('*')
      .order('z')
      .order('id');
    if (error) throw error;
    const items = (data || []).map((it) => ({
      ...it,
      author: it.created_by ? byId.get(it.created_by)?.full_name || null : null,
    }));
    res.json({ data: { items, ids: items.map((i) => i.id), serverTime: now } });
  } catch (err) {
    next(err);
  }
});

// POST /api/teams/board
router.post('/board', requireSocio, async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!BOARD_KINDS.includes(b.kind)) return res.status(400).json({ message: 'Tipo de elemento inválido.' });
    const content = (b.content ?? '').toString();
    if (content.length > MAX_BOARD_CONTENT) return res.status(413).json({ message: 'Elemento demasiado grande.' });
    const insert = {
      kind: b.kind,
      x: Number(b.x) || 0,
      y: Number(b.y) || 0,
      w: b.w == null ? null : Number(b.w),
      h: b.h == null ? null : Number(b.h),
      z: Number.isFinite(b.z) ? Math.trunc(b.z) : 0,
      color: b.color || null,
      content,
      created_by: req.profile.id,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('team_board_items').insert(insert).select('*').single();
    if (error) throw error;
    const { byId } = await membersMap();
    res.status(201).json({ data: { ...data, author: byId.get(data.created_by)?.full_name || null } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teams/board/:id
router.patch('/board/:id', requireSocio, async (req, res, next) => {
  try {
    const { data: prev } = await supabase
      .from('team_board_items')
      .select('id')
      .eq('id', req.params.id)
      .single();
    if (!prev) return res.status(404).json({ message: 'Elemento no encontrado.' });

    const b = req.body || {};
    const changes = {};
    for (const k of ['x', 'y', 'w', 'h']) {
      if (b[k] !== undefined) changes[k] = b[k] == null ? null : Number(b[k]);
    }
    if (b.z !== undefined) changes.z = Number.isFinite(b.z) ? Math.trunc(b.z) : 0;
    if (b.color !== undefined) changes.color = b.color || null;
    if (b.content !== undefined) {
      const content = (b.content ?? '').toString();
      if (content.length > MAX_BOARD_CONTENT) return res.status(413).json({ message: 'Elemento demasiado grande.' });
      changes.content = content;
    }
    changes.updated_at = new Date().toISOString();
    const { error } = await supabase.from('team_board_items').update(changes).eq('id', req.params.id);
    if (error) throw error;
    const { byId } = await membersMap();
    res.json({ data: await boardItemWithAuthor(req.params.id, byId) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/board/:id
router.delete('/board/:id', requireSocio, async (req, res, next) => {
  try {
    const { data: prev } = await supabase
      .from('team_board_items')
      .select('id')
      .eq('id', req.params.id)
      .single();
    if (!prev) return res.status(404).json({ message: 'Elemento no encontrado.' });
    const { error } = await supabase.from('team_board_items').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

/* ─── panel ────────────────────────────────────────────────────────────────── */

function doneByDay(doneTasks, days = 14) {
  const buckets = new Map();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const t of doneTasks) {
    const key = new Date(t.updated_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
  }
  return [...buckets.keys()].sort().map((day) => ({ day, n: buckets.get(day) }));
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// GET /api/teams/dashboard
router.get('/dashboard', requireSocio, async (req, res, next) => {
  try {
    const { members, byId } = await membersMap();
    const [tasksQ, activityQ] = await Promise.all([
      supabase.from('team_tasks').select('*'),
      supabase.from('team_activity').select('text, created_at').order('created_at', { ascending: false }).limit(12),
    ]);
    if (tasksQ.error) throw tasksQ.error;
    if (activityQ.error) throw activityQ.error;
    const tasks = tasksQ.data || [];

    const counts = { todo: 0, doing: 0, done: 0 };
    for (const t of tasks) if (counts[t.status] !== undefined) counts[t.status]++;

    // Carga por miembro: tareas abiertas (no 'done') asignadas a cada perfil.
    const openByAssignee = new Map();
    for (const t of tasks) {
      if (t.status !== 'done' && t.assignee_id) {
        openByAssignee.set(t.assignee_id, (openByAssignee.get(t.assignee_id) || 0) + 1);
      }
    }
    const per_user = members
      .map((m) => ({ name: m.full_name, open: openByAssignee.get(m.id) || 0 }))
      .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));

    // Mis pendientes: asignadas a mí y sin completar, por prioridad y vencimiento.
    const mine = tasks
      .filter((t) => t.assignee_id === req.profile.id && t.status !== 'done')
      .map((t) => withNames(t, byId))
      .sort((a, b) => {
        const pr = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
        if (pr !== 0) return pr;
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && !b.due_date) return -1;
        return (a.due_date || '').localeCompare(b.due_date || '');
      });

    const done_by_day = doneByDay(tasks.filter((t) => t.status === 'done'));

    res.json({
      data: {
        counts,
        per_user,
        mine,
        activity: activityQ.data || [],
        done_by_day,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
