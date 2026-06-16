/**
 * Endpoint de salud: GET /health
 *
 * Sirve para dos cosas:
 *   - Comprobar rápido que el servicio está vivo.
 *   - Que un "pinger" externo (cron-job.org / UptimeRobot) lo golpee cada
 *     pocos minutos y mantenga despierto el server de Render (free tier).
 */
import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, service: 'lince-api', time: new Date().toISOString() });
});

export default router;
