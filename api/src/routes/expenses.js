/**
 * Rutas de GASTOS Y APROBACIONES del Startup OS.
 *
 *   GET  /api/expenses            -> socio. Lista con su bitácora y montos.
 *   POST /api/expenses             -> socio. Registra un gasto (queda pendiente).
 *   POST /api/expenses/:id/approve -> socio. Aprueba (no el propio; aprobadores distintos).
 *   POST /api/expenses/:id/reject  -> socio. Rechaza (no el propio).
 *
 * Reglas anti-fraude aplicadas ACÁ, en el servidor (no en el navegador):
 *   · Segregación de funciones: nadie aprueba/rechaza su propio gasto.
 *   · Doble aprobación: montos >= APPROVAL_THRESHOLD requieren 2 socios distintos.
 *   · Bitácora append-only: cada acción es un evento; NO hay update/delete de la
 *     historia. `status` es un cache que solo mueve el servidor.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { EXPENSE_CATEGORIES, APPROVAL_THRESHOLD } from '../constants.js';

const router = Router();

const createSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  currency: z.enum(['ARS', 'USD']).default('USD'),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(2).max(500),
  provider: z.string().trim().max(160).optional(),
  // Referencia del comprobante: link (Drive/factura) o N° de factura. Texto libre.
  receipt_url: z.string().trim().max(2000).optional(),
});

const decisionSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

/**
 * Enriquece los gastos con su bitácora, el nombre del registrante/actores y la
 * cantidad de aprobaciones. Una sola pasada de consultas para toda la lista.
 */
async function attachDetails(expenses) {
  if (!expenses.length) return [];
  const ids = expenses.map((e) => e.id);

  const { data: events, error: evErr } = await supabase
    .from('expense_events')
    .select('id, expense_id, actor, action, note, created_at')
    .in('expense_id', ids)
    .order('created_at', { ascending: true });
  if (evErr) throw evErr;

  const profileIds = new Set();
  expenses.forEach((e) => profileIds.add(e.registered_by));
  (events || []).forEach((ev) => profileIds.add(ev.actor));

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', [...profileIds]);
  if (pErr) throw pErr;
  const nameOf = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));

  const eventsByExpense = {};
  for (const ev of events || []) {
    (eventsByExpense[ev.expense_id] ||= []).push({ ...ev, actor_name: nameOf[ev.actor] || null });
  }

  return expenses.map((e) => {
    const evs = eventsByExpense[e.id] || [];
    return {
      ...e,
      registered_by_name: nameOf[e.registered_by] || null,
      approvals: evs.filter((ev) => ev.action === 'aprobado').length,
      events: evs,
    };
  });
}

/** Carga un gasto por id, ya enriquecido (o null si no existe). */
async function loadOne(id) {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
  if (error || !data) return null;
  const [full] = await attachDetails([data]);
  return full;
}

// GET /api/expenses — socio
router.get('/', requireSocio, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ data: await attachDetails(data || []) });
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses — socio registra un gasto
router.post('/', requireSocio, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const required_approvals = parsed.data.amount >= APPROVAL_THRESHOLD ? 2 : 1;

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        ...parsed.data,
        registered_by: req.user.id,
        required_approvals,
        status: 'pendiente',
      })
      .select()
      .single();
    if (error) throw error;

    // Primer evento de la bitácora: el registro.
    const { error: evErr } = await supabase.from('expense_events').insert({
      expense_id: expense.id,
      actor: req.user.id,
      action: 'registrado',
    });
    if (evErr) throw evErr;

    return res.status(201).json({ data: await loadOne(expense.id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses/:id/approve — socio aprueba (no el propio; aprobadores distintos)
router.post('/:id/approve', requireSocio, async (req, res, next) => {
  try {
    const parsed = decisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos inválidos.' });
    }

    const { data: expense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });

    if (expense.status !== 'pendiente') {
      return res.status(409).json({ message: 'El gasto ya fue resuelto.' });
    }
    // Segregación de funciones: no podés aprobar tu propio gasto.
    if (expense.registered_by === req.user.id) {
      return res
        .status(403)
        .json({ message: 'No podés aprobar un gasto que registraste vos.' });
    }
    // Un mismo socio no aprueba dos veces (aprobadores distintos).
    const { data: mine } = await supabase
      .from('expense_events')
      .select('id')
      .eq('expense_id', expense.id)
      .eq('actor', req.user.id)
      .eq('action', 'aprobado');
    if (mine && mine.length) {
      return res.status(409).json({ message: 'Ya aprobaste este gasto.' });
    }

    const { error: evErr } = await supabase.from('expense_events').insert({
      expense_id: expense.id,
      actor: req.user.id,
      action: 'aprobado',
      note: parsed.data.note || null,
    });
    if (evErr) throw evErr;

    // ¿Alcanzó las aprobaciones requeridas? (cada 'aprobado' es de un socio distinto)
    const { count } = await supabase
      .from('expense_events')
      .select('id', { count: 'exact', head: true })
      .eq('expense_id', expense.id)
      .eq('action', 'aprobado');
    if ((count || 0) >= expense.required_approvals) {
      const { error: upErr } = await supabase
        .from('expenses')
        .update({ status: 'aprobado' })
        .eq('id', expense.id);
      if (upErr) throw upErr;
    }

    return res.json({ data: await loadOne(expense.id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses/:id/reject — socio rechaza (no el propio)
router.post('/:id/reject', requireSocio, async (req, res, next) => {
  try {
    const parsed = decisionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos inválidos.' });
    }

    const { data: expense } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });

    if (expense.status !== 'pendiente') {
      return res.status(409).json({ message: 'El gasto ya fue resuelto.' });
    }
    if (expense.registered_by === req.user.id) {
      return res
        .status(403)
        .json({ message: 'No podés rechazar un gasto que registraste vos.' });
    }

    const { error: evErr } = await supabase.from('expense_events').insert({
      expense_id: expense.id,
      actor: req.user.id,
      action: 'rechazado',
      note: parsed.data.note || null,
    });
    if (evErr) throw evErr;

    const { error: upErr } = await supabase
      .from('expenses')
      .update({ status: 'rechazado' })
      .eq('id', expense.id);
    if (upErr) throw upErr;

    return res.json({ data: await loadOne(expense.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
