/**
 * Métricas para el resumen del panel (Fase 5).
 *
 *   GET /api/stats -> admin. Conteos por estado de leads, presupuestos y reseñas.
 *
 * Para un CRM chico alcanza con traer la columna `status` y contar en memoria;
 * evita varias queries de count y mantiene el endpoint simple.
 */
import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Cuenta filas por valor de `status`, agregando el total.
function tally(rows) {
  const t = { total: rows.length };
  for (const r of rows) {
    const key = r.status || 'desconocido';
    t[key] = (t[key] || 0) + 1;
  }
  return t;
}

router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const [leads, budgets, reviews] = await Promise.all([
      supabase.from('leads').select('status'),
      supabase.from('budgets').select('status'),
      supabase.from('reviews').select('status'),
    ]);
    if (leads.error) throw leads.error;
    if (budgets.error) throw budgets.error;
    if (reviews.error) throw reviews.error;

    return res.json({
      data: {
        leads: tally(leads.data || []),
        budgets: tally(budgets.data || []),
        reviews: tally(reviews.data || []),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
