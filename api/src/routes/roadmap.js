/**
 * Rutas de ROADMAP del Startup OS.
 *
 *   GET    /api/roadmap      -> socio. Iniciativas (agrupables por trimestre en la UI).
 *   POST   /api/roadmap       -> socio. Crea una iniciativa.
 *   PATCH  /api/roadmap/:id    -> socio. Edición y cambio de estado.
 *   DELETE /api/roadmap/:id    -> socio. Borra una iniciativa.
 *
 * Cada iniciativa puede enlazarse a un objetivo (objective_id) para conectar el
 * roadmap con los OKRs. El nombre del dueño y del objetivo se resuelven al leer.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { ROADMAP_STATUSES } from '../constants.js';

const router = Router();

const quarterSchema = z
  .string()
  .regex(/^\d{4}-Q[1-4]$/, 'Trimestre inválido (usá YYYY-Q1..Q4).');

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  quarter: quarterSchema,
  status: z.enum(ROADMAP_STATUSES).default('planeado'),
  objective_id: z.string().uuid().nullish(),
  owner: z.string().uuid().nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

const updateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    quarter: quarterSchema.optional(),
    status: z.enum(ROADMAP_STATUSES).optional(),
    objective_id: z.string().uuid().nullish(),
    owner: z.string().uuid().nullish(),
    notes: z.string().trim().max(1000).nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

/** Adjunta nombre del dueño y título del objetivo enlazado a cada iniciativa. */
async function attachNames(items) {
  if (!items.length) return [];
  const ownerIds = [...new Set(items.map((i) => i.owner).filter(Boolean))];
  const objIds = [...new Set(items.map((i) => i.objective_id).filter(Boolean))];

  const [ownersQ, objsQ] = await Promise.all([
    ownerIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', ownerIds)
      : Promise.resolve({ data: [] }),
    objIds.length
      ? supabase.from('okr_objectives').select('id, title').in('id', objIds)
      : Promise.resolve({ data: [] }),
  ]);
  if (ownersQ.error) throw ownersQ.error;
  if (objsQ.error) throw objsQ.error;
  const nameOf = Object.fromEntries((ownersQ.data || []).map((p) => [p.id, p.full_name]));
  const objOf = Object.fromEntries((objsQ.data || []).map((o) => [o.id, o.title]));

  return items.map((i) => ({
    ...i,
    owner_name: i.owner ? nameOf[i.owner] || null : null,
    objective_title: i.objective_id ? objOf[i.objective_id] || null : null,
  }));
}

/** Carga una iniciativa por id, ya enriquecida (o null si no existe). */
async function loadOne(id) {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const [full] = await attachNames([data]);
  return full;
}

// GET /api/roadmap — socio. ?quarter=YYYY-Qn opcional.
router.get('/', requireSocio, async (req, res, next) => {
  try {
    let query = supabase
      .from('roadmap_items')
      .select('*')
      .order('quarter', { ascending: false })
      .order('created_at', { ascending: true });
    if (typeof req.query.quarter === 'string' && /^\d{4}-Q[1-4]$/.test(req.query.quarter)) {
      query = query.eq('quarter', req.query.quarter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: await attachNames(data || []) });
  } catch (err) {
    next(err);
  }
});

// POST /api/roadmap — socio
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
      .from('roadmap_items')
      .insert({ ...parsed.data, created_by: req.user.id })
      .select('id')
      .single();
    if (error) throw error;
    return res.status(201).json({ data: await loadOne(data.id) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/roadmap/:id — socio
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
      .from('roadmap_items')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Iniciativa no encontrada.' });
    return res.json({ data: await loadOne(data.id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/roadmap/:id — socio
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('roadmap_items')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Iniciativa no encontrada.' });
    return res.json({ data: { id: data.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
