/**
 * Rutas de PRESUPUESTOS y su seguimiento (Fase 4).
 *
 *   GET   /api/budgets       -> admin. Lista (con filtro ?status=).
 *   POST  /api/budgets        -> admin. Alta de un presupuesto.
 *   PATCH /api/budgets/:id     -> admin. Actualiza estado / datos.
 *
 * El DISPARO de los recordatorios NO vive acá: lo agenda Supabase con
 * pg_cron + la Edge Function `budget-followups` (ver supabase/), porque el
 * server de Render (free) se duerme y no es fiable para tareas programadas.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { BUDGET_STATUSES } from '../constants.js';

const router = Router();

const createSchema = z.object({
  business_id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(2).max(120),
  customer_contact: z.string().trim().min(3).max(120),
  amount: z.number().nonnegative().optional(),
  description: z.string().max(1000).optional(),
});

const updateSchema = z
  .object({
    status: z.enum(BUDGET_STATUSES).optional(),
    amount: z.number().nonnegative().optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

// GET /api/budgets — admin
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    let query = supabase.from('budgets').select('*').order('created_at', { ascending: false });
    const { status } = req.query;
    if (status && BUDGET_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets — admin
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...parsed.data, status: 'enviado' })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/budgets/:id — admin
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('budgets')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Presupuesto no encontrado.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
