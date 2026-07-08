/**
 * Rutas de SUSCRIPCIONES SAAS del Startup OS (inventario recurrente).
 *
 *   GET    /api/subscriptions      -> socio. Lista completa con costo mensual derivado.
 *   POST   /api/subscriptions       -> socio. Alta de una suscripción.
 *   PATCH  /api/subscriptions/:id   -> socio. Edición (incluye pausar/cancelar vía status).
 *   DELETE /api/subscriptions/:id   -> socio. Borra una fila (para altas erradas;
 *                                      una baja real se registra con status 'cancelada').
 *
 * `monthly_cost` se calcula al vuelo (anual / 12) para que el frontend nunca
 * tenga que duplicar esa regla.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { SUBSCRIPTION_STATUSES, BILLING_CYCLES, CURRENCIES } from '../constants.js';

const router = Router();

const baseFields = {
  name: z.string().trim().min(2).max(160),
  vendor: z.string().trim().max(160).nullish(),
  seats: z.number().int().min(1).max(10000).default(1),
  amount: z.number().nonnegative().max(1_000_000_000),
  currency: z.enum(CURRENCIES).default('USD'),
  billing_cycle: z.enum(BILLING_CYCLES).default('mensual'),
  renews_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usá YYYY-MM-DD).')
    .nullish(),
  status: z.enum(SUBSCRIPTION_STATUSES).default('activa'),
  notes: z.string().trim().max(500).nullish(),
};

const createSchema = z.object(baseFields);

const updateSchema = z
  .object({
    name: baseFields.name.optional(),
    vendor: baseFields.vendor,
    seats: z.number().int().min(1).max(10000).optional(),
    amount: z.number().nonnegative().max(1_000_000_000).optional(),
    currency: z.enum(CURRENCIES).optional(),
    billing_cycle: z.enum(BILLING_CYCLES).optional(),
    renews_on: baseFields.renews_on,
    status: z.enum(SUBSCRIPTION_STATUSES).optional(),
    notes: baseFields.notes,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

/** Suma el costo mensual normalizado (una suscripción anual reparte en 12). */
function withDerived(row) {
  const amount = Number(row.amount);
  return {
    ...row,
    monthly_cost: Number((row.billing_cycle === 'anual' ? amount / 12 : amount).toFixed(2)),
  };
}

// GET /api/subscriptions — socio
router.get('/', requireSocio, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('status', { ascending: true }) // activa < cancelada < pausada (alfabético)
      .order('name', { ascending: true });
    if (error) throw error;
    return res.json({ data: (data || []).map(withDerived) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions — socio
router.post('/', requireSocio, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ ...parsed.data, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ data: withDerived(data) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id — socio
router.patch('/:id', requireSocio, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Suscripción no encontrada.' });
    return res.json({ data: withDerived(data) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/:id — socio
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Suscripción no encontrada.' });
    return res.json({ data: { id: data.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
