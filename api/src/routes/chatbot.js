/**
 * Rutas del CHATBOT conectado a backend real (Fase 3 — todavía stub).
 *
 * Hoy el demo de WhatsApp de la landing corre 100% en el cliente con un árbol
 * hardcodeado (web/src/landing/chatbot.js, datos simulados). El objetivo de la
 * fase 3 es servir ese árbol desde la base y persistir cada sesión, para poder:
 *   - editar los flujos sin tocar el código,
 *   - registrar conversaciones (analítica),
 *   - reusar el mismo motor para distintos negocios.
 *
 * Endpoints previstos:
 *   GET  /api/chatbot/flows/:slug   -> devuelve el árbol de conversación
 *   POST /api/chatbot/sessions      -> crea una sesión y devuelve su id
 *   POST /api/chatbot/sessions/:id  -> avanza la conversación (guarda estado)
 *
 * Mientras tanto responden 501 para dejar el contrato explícito.
 */
import { Router } from 'express';

const router = Router();

const notImplemented = (_req, res) =>
  res.status(501).json({ message: 'Endpoint del chatbot planificado para la Fase 3.' });

router.get('/flows/:slug', notImplemented);
router.post('/sessions', notImplemented);
router.post('/sessions/:id', notImplemented);

export default router;
