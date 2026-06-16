/**
 * Rutas de PRESUPUESTOS y su seguimiento (Fase 4 — todavía stub).
 *
 * Idea: cargar presupuestos enviados y que el sistema haga el seguimiento solo
 * (recordatorios a las 48 hs sin respuesta). El DISPARO de los recordatorios
 * NO vive acá: se programa en Supabase con pg_cron + una Edge Function
 * (ver supabase/functions/budget-followups/), porque el server de Render
 * (free) se duerme y no es fiable para tareas programadas.
 *
 * Endpoints previstos:
 *   GET   /api/budgets          -> lista (admin)
 *   POST  /api/budgets          -> alta de un presupuesto (admin)
 *   PATCH /api/budgets/:id       -> actualizar estado (admin)
 *
 * Mientras tanto responden 501 para dejar el contrato explícito.
 */
import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const notImplemented = (_req, res) =>
  res.status(501).json({ message: 'Endpoint de presupuestos planificado para la Fase 4.' });

router.get('/', requireAdmin, notImplemented);
router.post('/', requireAdmin, notImplemented);
router.patch('/:id', requireAdmin, notImplemented);

export default router;
