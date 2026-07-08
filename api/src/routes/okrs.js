/**
 * Rutas de OKRs del Startup OS (objetivos por trimestre + key results).
 *
 *   GET    /api/okrs                    -> socio. Objetivos con sus KRs y avance.
 *   POST   /api/okrs                     -> socio. Crea objetivo (con KRs opcionales).
 *   PATCH  /api/okrs/:id                 -> socio. Edita título/trimestre/dueño/estado.
 *   DELETE /api/okrs/:id                 -> socio. Borra un objetivo (y sus KRs, cascade).
 *   POST   /api/okrs/:id/key-results     -> socio. Agrega un KR a un objetivo.
 *   PATCH  /api/okrs/key-results/:id     -> socio. Check-in / edición de un KR.
 *   DELETE /api/okrs/key-results/:id     -> socio. Borra un KR.
 *
 * El avance NUNCA se guarda: se deriva acá como promedio de
 * min(current/target, 1) sobre los KRs del objetivo (0 si no tiene KRs).
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { OKR_STATUSES } from '../constants.js';

const router = Router();

const quarterSchema = z
  .string()
  .regex(/^\d{4}-Q[1-4]$/, 'Trimestre inválido (usá YYYY-Q1..Q4).');

const krFields = z.object({
  title: z.string().trim().min(2).max(200),
  unit: z.string().trim().max(20).nullish(),
  target: z.number().positive().max(1_000_000_000_000),
  current: z.number().nonnegative().max(1_000_000_000_000).default(0),
});

const createSchema = z.object({
  quarter: quarterSchema,
  title: z.string().trim().min(2).max(200),
  owner: z.string().uuid().nullish(),
  key_results: z.array(krFields).max(8).default([]),
});

const updateSchema = z
  .object({
    quarter: quarterSchema.optional(),
    title: z.string().trim().min(2).max(200).optional(),
    owner: z.string().uuid().nullish(),
    status: z.enum(OKR_STATUSES).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

const krUpdateSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    unit: z.string().trim().max(20).nullish(),
    target: z.number().positive().max(1_000_000_000_000).optional(),
    current: z.number().nonnegative().max(1_000_000_000_000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

/** Avance de un objetivo: promedio de min(current/target, 1) de sus KRs. */
function progressOf(keyResults) {
  if (!keyResults.length) return 0;
  const sum = keyResults.reduce(
    (a, kr) => a + Math.min(Number(kr.current) / Number(kr.target), 1),
    0
  );
  return Math.round((sum / keyResults.length) * 100);
}

/** Adjunta KRs, avance y nombre del dueño a una lista de objetivos. */
async function attachDetails(objectives) {
  if (!objectives.length) return [];
  const ids = objectives.map((o) => o.id);

  const { data: krs, error: krErr } = await supabase
    .from('okr_key_results')
    .select('*')
    .in('objective_id', ids)
    .order('created_at', { ascending: true });
  if (krErr) throw krErr;

  const ownerIds = [...new Set(objectives.map((o) => o.owner).filter(Boolean))];
  let nameOf = {};
  if (ownerIds.length) {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds);
    if (pErr) throw pErr;
    nameOf = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
  }

  const krsByObjective = {};
  for (const kr of krs || []) {
    (krsByObjective[kr.objective_id] ||= []).push(kr);
  }

  return objectives.map((o) => {
    const keyResults = krsByObjective[o.id] || [];
    return {
      ...o,
      owner_name: o.owner ? nameOf[o.owner] || null : null,
      progress: progressOf(keyResults),
      key_results: keyResults,
    };
  });
}

/** Carga un objetivo por id, ya enriquecido (o null si no existe). */
async function loadOne(id) {
  const { data, error } = await supabase
    .from('okr_objectives')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const [full] = await attachDetails([data]);
  return full;
}

// GET /api/okrs — socio. ?status=activo|archivado (por defecto, todos).
router.get('/', requireSocio, async (req, res, next) => {
  try {
    let query = supabase
      .from('okr_objectives')
      .select('*')
      .order('quarter', { ascending: false })
      .order('created_at', { ascending: true });
    if (OKR_STATUSES.includes(req.query.status)) {
      query = query.eq('status', req.query.status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: await attachDetails(data || []) });
  } catch (err) {
    next(err);
  }
});

// POST /api/okrs — socio. Crea el objetivo y sus KRs iniciales.
router.post('/', requireSocio, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { key_results, ...fields } = parsed.data;

    const { data: objective, error } = await supabase
      .from('okr_objectives')
      .insert({ ...fields, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;

    if (key_results.length) {
      const { error: krErr } = await supabase
        .from('okr_key_results')
        .insert(key_results.map((kr) => ({ ...kr, objective_id: objective.id })));
      if (krErr) throw krErr;
    }
    return res.status(201).json({ data: await loadOne(objective.id) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/okrs/:id — socio
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
      .from('okr_objectives')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Objetivo no encontrado.' });
    return res.json({ data: await loadOne(data.id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/okrs/:id — socio (los KRs caen por cascade)
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('okr_objectives')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Objetivo no encontrado.' });
    return res.json({ data: { id: data.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/okrs/:id/key-results — socio
router.post('/:id/key-results', requireSocio, async (req, res, next) => {
  try {
    const parsed = krFields.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    // El objetivo tiene que existir (y así devolvemos 404 en vez de un error de FK).
    const { data: objective } = await supabase
      .from('okr_objectives')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!objective) return res.status(404).json({ message: 'Objetivo no encontrado.' });

    const { error } = await supabase
      .from('okr_key_results')
      .insert({ ...parsed.data, objective_id: objective.id });
    if (error) throw error;
    return res.status(201).json({ data: await loadOne(objective.id) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/okrs/key-results/:id — socio (check-in: actualiza `current`)
router.patch('/key-results/:id', requireSocio, async (req, res, next) => {
  try {
    const parsed = krUpdateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('okr_key_results')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('objective_id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Key result no encontrado.' });
    return res.json({ data: await loadOne(data.objective_id) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/okrs/key-results/:id — socio
router.delete('/key-results/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('okr_key_results')
      .delete()
      .eq('id', req.params.id)
      .select('objective_id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Key result no encontrado.' });
    return res.json({ data: await loadOne(data.objective_id) });
  } catch (err) {
    next(err);
  }
});

export default router;
