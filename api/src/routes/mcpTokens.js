/**
 * Rutas de TOKENS MCP del Startup OS (vista "Conectar IA").
 *
 *   GET    /api/mcp/tokens      -> socio. Sus tokens (sin el secreto, obvio).
 *   POST   /api/mcp/tokens       -> socio. Genera uno nuevo; el token en claro
 *                                  se devuelve UNA sola vez en esta respuesta.
 *   DELETE /api/mcp/tokens/:id   -> socio. Revoca uno propio (queda auditado).
 *
 * Cada token pertenece al socio que lo generó y hereda sus permisos: lo que él
 * no puede hacer en la app, la IA tampoco. Solo se listan/revocan los propios.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { mintMcpToken, hashMcpToken } from '../lib/mcpTokens.js';

const router = Router();

const createSchema = z.object({
  label: z.string().trim().min(2).max(80),
});

// GET /api/mcp/tokens — socio (solo los propios)
router.get('/', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mcp_tokens')
      .select('id, label, created_at, last_used_at, revoked_at')
      .eq('profile_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/mcp/tokens — socio. Única vez que viaja el token en claro.
router.post('/', requireSocio, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const token = mintMcpToken();
    const { data, error } = await supabase
      .from('mcp_tokens')
      .insert({
        profile_id: req.user.id,
        label: parsed.data.label,
        token_hash: hashMcpToken(token),
      })
      .select('id, label, created_at')
      .single();
    if (error) throw error;

    return res.status(201).json({ data: { ...data, token } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mcp/tokens/:id — socio. Revoca (no borra: queda la auditoría).
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('mcp_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('profile_id', req.user.id) // solo los propios
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Token no encontrado o ya revocado.' });
    return res.json({ data: { id: data.id, revoked: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
