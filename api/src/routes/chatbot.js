/**
 * Rutas del CHATBOT servido desde la base (Fase 3).
 *
 *   GET  /api/chatbot/flows/:slug        -> árbol de conversación del negocio.
 *   POST /api/chatbot/sessions            -> crea una sesión, devuelve su id.
 *   POST /api/chatbot/sessions/:id/messages -> registra un mensaje y, opcional,
 *                                              actualiza el estado de la sesión.
 *
 * Esto permite, a futuro, editar los flujos sin tocar el código y registrar
 * conversaciones para analítica. La demo de la landing sigue funcionando con
 * su árbol embebido; el cliente puede migrar a estos endpoints cuando se
 * despliegue y se cargue un flujo (ver supabase/seed.sql).
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Los POST son públicos y escriben en la base: sin límite, cualquiera puede
// crear sesiones/mensajes hasta llenar el tier gratuito de Supabase. Los topes
// son holgados para una conversación real (cada turno inserta el mensaje del
// visitante y el del bot) pero cortan el abuso masivo desde una misma IP.
const sessionLimit = createRateLimiter({ max: 10, dayMax: 60 });
const messageLimit = createRateLimiter({ max: 60, dayMax: 600 });

// GET /api/chatbot/flows/:slug — público (el demo es público)
router.get('/flows/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('chatbot_flows')
      .select('id, slug, name, tree')
      .eq('slug', req.params.slug)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Flujo no encontrado.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/chatbot/sessions — crea una sesión para un flujo.
// Acepta flow_id (uuid) o flow_slug (lo que conoce la landing); ambos opcionales.
const sessionSchema = z.object({
  flow_id: z.string().uuid().optional(),
  flow_slug: z.string().max(120).optional(),
});
router.post('/sessions', sessionLimit, async (req, res, next) => {
  try {
    const parsed = sessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos inválidos.' });
    }

    // Resolvemos el flow_id: si vino el slug, lo buscamos.
    let flowId = parsed.data.flow_id ?? null;
    if (!flowId && parsed.data.flow_slug) {
      const { data: flow } = await supabase
        .from('chatbot_flows')
        .select('id')
        .eq('slug', parsed.data.flow_slug)
        .eq('active', true)
        .maybeSingle();
      flowId = flow?.id ?? null;
    }

    const { data, error } = await supabase
      .from('chatbot_sessions')
      .insert({ flow_id: flowId })
      .select('id')
      .single();
    if (error) throw error;
    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/chatbot/sessions/:id/messages — registra un mensaje + estado
const messageSchema = z.object({
  role: z.enum(['bot', 'user']),
  text: z.string().max(2000),
  // Opcionales para reflejar el avance de la conversación.
  current_node: z.string().max(120).optional(),
  state: z.record(z.any()).optional(),
  completed: z.boolean().optional(),
});
router.post('/sessions/:id/messages', messageLimit, async (req, res, next) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Mensaje inválido.' });
    }
    const { role, text, current_node, state, completed } = parsed.data;

    const { error: msgErr } = await supabase
      .from('chatbot_messages')
      .insert({ session_id: req.params.id, role, text });
    if (msgErr) throw msgErr;

    // Si vino info de avance, actualizamos la sesión.
    const sessionPatch = {};
    if (current_node !== undefined) sessionPatch.current_node = current_node;
    if (state !== undefined) sessionPatch.state = state;
    if (completed !== undefined) sessionPatch.completed = completed;
    if (Object.keys(sessionPatch).length > 0) {
      const { error: sessErr } = await supabase
        .from('chatbot_sessions')
        .update(sessionPatch)
        .eq('id', req.params.id);
      if (sessErr) throw sessErr;
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
