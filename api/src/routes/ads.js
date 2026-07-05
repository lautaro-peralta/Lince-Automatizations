/**
 * Rutas de RENDIMIENTO DE ANUNCIOS del Startup OS (carga manual).
 *
 *   GET   /api/ads        -> socio. Lista de métricas por período y canal.
 *   POST  /api/ads         -> socio. Alta/actualización (upsert por período+canal).
 *   PATCH /api/ads/:id      -> socio. Edita una fila cargada.
 *
 * ROAS (revenue/spend) y CAC (spend/conversions) se calculan al vuelo en cada
 * fila; se dejan como null cuando el divisor es 0 para no inventar números.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { AD_CHANNELS } from '../constants.js';

const router = Router();

// period: 'YYYY-MM' o fecha ISO; lo normalizamos al primer día del mes.
const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Período inválido (usá YYYY-MM).')
  .transform((s) => `${s.slice(0, 7)}-01`);

const createSchema = z.object({
  period: monthSchema,
  channel: z.enum(AD_CHANNELS),
  spend: z.number().nonnegative().max(1_000_000_000).default(0),
  revenue: z.number().nonnegative().max(1_000_000_000).default(0),
  conversions: z.number().int().nonnegative().max(10_000_000).default(0),
});

const updateSchema = z
  .object({
    spend: z.number().nonnegative().max(1_000_000_000).optional(),
    revenue: z.number().nonnegative().max(1_000_000_000).optional(),
    conversions: z.number().int().nonnegative().max(10_000_000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

/** Suma ROAS y CAC calculados a cada fila. */
function withDerived(row) {
  const spend = Number(row.spend);
  const revenue = Number(row.revenue);
  const conv = Number(row.conversions);
  return {
    ...row,
    roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : null,
    cac: conv > 0 ? Number((spend / conv).toFixed(2)) : null,
  };
}

// GET /api/ads — socio
router.get('/', requireSocio, async (req, res, next) => {
  try {
    let query = supabase
      .from('ad_metrics')
      .select('*')
      .order('period', { ascending: false })
      .order('channel', { ascending: true });
    const { period } = req.query;
    if (period && /^\d{4}-\d{2}/.test(period)) {
      query = query.eq('period', `${period.slice(0, 7)}-01`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: (data || []).map(withDerived) });
  } catch (err) {
    next(err);
  }
});

// POST /api/ads — socio (upsert por período+canal)
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
      .from('ad_metrics')
      .upsert(
        { ...parsed.data, created_by: req.user.id, updated_at: new Date().toISOString() },
        { onConflict: 'period,channel' }
      )
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ data: withDerived(data) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/ads/:id — socio
router.patch('/:id', requireSocio, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('ad_metrics')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Métrica no encontrada.' });
    return res.json({ data: withDerived(data) });
  } catch (err) {
    next(err);
  }
});

export default router;
