/**
 * Rutas de LEADS (captura de contactos del formulario de la landing).
 *
 *   POST /api/leads   -> público. Valida y guarda un lead nuevo.
 *   GET  /api/leads   -> admin.   Lista los leads para el panel.
 *
 * Esta es la primera "rebanada vertical" del CRM que funciona de punta a
 * punta: formulario (web) → API (acá) → base de datos (Supabase).
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Esquema de validación del lead. El backend NUNCA confía en el cliente:
// vuelve a validar todo lo que llega.
const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(80),
  business: z.string().trim().max(120).optional().default(''),
  contact: z.string().trim().min(3, 'Contacto inválido').max(120),
  message: z.string().trim().min(5, 'Mensaje muy corto').max(1000),
  // Honeypot anti-spam: debe llegar vacío.
  website: z.string().max(200).optional().default(''),
});

// POST /api/leads — público
router.post('/', async (req, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const lead = parsed.data;

    // Si el honeypot vino lleno, es un bot: respondemos OK pero NO guardamos.
    if (lead.website && lead.website.trim() !== '') {
      return res.status(201).json({ ok: true });
    }

    const { error } = await supabase.from('leads').insert({
      name: lead.name,
      business: lead.business || null,
      contact: lead.contact,
      message: lead.message,
      source: 'landing',
      status: 'nuevo',
    });
    if (error) throw error;

    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads — solo admin autenticado
router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
