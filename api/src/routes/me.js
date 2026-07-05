/**
 * Rutas de identidad del Startup OS.
 *
 *   GET /api/me           -> socio. Datos del usuario logueado (del JWT + profile).
 *   GET /api/me/partners   -> socio. Lista de socios (para mostrar quién es quién).
 *
 * El nombre sale de `profiles.full_name` (que se setea al crear la cuenta), NO se
 * deduce del email.
 */
import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';

const router = Router();

// GET /api/me — datos del usuario actual
router.get('/', requireSocio, (req, res) => {
  return res.json({
    data: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.profile.full_name,
      role: req.profile.role,
    },
  });
});

// GET /api/me/partners — integrantes con acceso al Startup OS.
//   Mismas cuentas que el panel: quien está como 'admin' (el equipo de la
//   landing) o como 'socio' tiene acceso, así no hay que mantener dos padrones.
router.get('/partners', requireSocio, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['socio', 'admin'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
