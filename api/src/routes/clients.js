/**
 * Rutas de CLIENTES (CRM + salud) del Startup OS.
 *
 *   GET    /api/clients      -> socio. Cartera completa.
 *   POST   /api/clients       -> socio. Alta de un cliente.
 *   PATCH  /api/clients/:id    -> socio. Edición (incluye status y health).
 *   DELETE /api/clients/:id    -> socio. Baja física (para altas erradas; una
 *                                baja real de negocio se marca con status 'baja').
 *
 * Son los clientes ACTIVOS de la agencia, distintos de `leads` (prospectos
 * entrantes de la landing). `mrr` de los clientes 'activo' alimenta el MRR real
 * del dashboard; `health` alimenta el riesgo de churn.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { CLIENT_STATUSES, CLIENT_HEALTH, CURRENCIES } from '../constants.js';

const router = Router();

const baseFields = {
  name: z.string().trim().min(2).max(160),
  contact: z.string().trim().max(200).nullish(),
  plan: z.string().trim().max(80).nullish(),
  mrr: z.number().nonnegative().max(1_000_000_000).default(0),
  currency: z.enum(CURRENCIES).default('USD'),
  status: z.enum(CLIENT_STATUSES).default('activo'),
  health: z.enum(CLIENT_HEALTH).default('saludable'),
  since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usá YYYY-MM-DD).')
    .nullish(),
  notes: z.string().trim().max(1000).nullish(),
};

const createSchema = z.object(baseFields);

const updateSchema = z
  .object({
    name: baseFields.name.optional(),
    contact: baseFields.contact,
    plan: baseFields.plan,
    mrr: z.number().nonnegative().max(1_000_000_000).optional(),
    currency: z.enum(CURRENCIES).optional(),
    status: z.enum(CLIENT_STATUSES).optional(),
    health: z.enum(CLIENT_HEALTH).optional(),
    since: baseFields.since,
    notes: baseFields.notes,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

// GET /api/clients — socio
router.get('/', requireSocio, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('status', { ascending: true })
      .order('mrr', { ascending: false });
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/clients — socio
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
      .from('clients')
      .insert({ ...parsed.data, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/clients/:id — socio
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
      .from('clients')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Cliente no encontrado.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/clients/:id — socio
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Cliente no encontrado.' });
    return res.json({ data: { id: data.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
