/**
 * Rutas de RESEÑAS (Fase 3 — alimentan el monitor del CRM).
 *
 *   GET   /api/reviews       -> admin. Lista (con filtro ?status=).
 *   PATCH /api/reviews/:id     -> admin. Cambia estado / respuesta sugerida.
 *
 * Nota: el "monitor en vivo" de la landing seguirá siendo una animación
 * ilustrativa (datos simulados, como aclara la página). Estos endpoints son
 * para gestionar reseñas REALES desde el panel interno.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { REVIEW_STATUSES } from '../constants.js';
import { suggestReviewReply } from '../lib/ai.js';

const router = Router();

const updateSchema = z
  .object({
    status: z.enum(REVIEW_STATUSES).optional(),
    suggested_response: z.string().max(2000).optional(),
    priority: z.enum(['baja', 'media', 'urgente']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

// GET /api/reviews — admin
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    let query = supabase.from('reviews').select('*').order('detected_at', { ascending: false });
    const { status } = req.query;
    if (status && REVIEW_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reviews/:id — admin
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    // Si se marca como respondida, sellamos la fecha de respuesta.
    const patch = { ...parsed.data };
    if (patch.status === 'respondida') patch.responded_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('reviews')
      .update(patch)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Reseña no encontrada.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:id/suggest — admin. Genera (y guarda) una respuesta sugerida.
router.post('/:id/suggest', requireAdmin, async (req, res, next) => {
  try {
    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada.' });

    const suggestion = await suggestReviewReply(review);

    const { data, error: upErr } = await supabase
      .from('reviews')
      .update({ suggested_response: suggestion })
      .eq('id', req.params.id)
      .select()
      .single();
    if (upErr) throw upErr;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
