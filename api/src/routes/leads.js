/**
 * Rutas de LEADS (captura y gestión de contactos).
 *
 *   POST  /api/leads      -> público. Valida y guarda un lead nuevo.
 *   GET   /api/leads      -> admin.   Lista (con filtros status y q).
 *   PATCH /api/leads/:id   -> admin.   Cambia estado y/o notas internas.
 *
 * Primera "rebanada vertical" del CRM de punta a punta:
 * formulario (web) → API (acá) → base de datos (Supabase).
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { LEAD_STATUSES } from '../constants.js';
import { notifyNewLead } from '../lib/notify.js';

const router = Router();

// El POST es público y escribe en la base + dispara notificaciones: mismo
// límite por IP que el formulario de prospectos (ráfaga + tope diario). Sin
// esto, un bot que le pegue directo a la API (salteando el honeypot del
// formulario) puede llenar la tabla y quemar la cuota de emails.
const rateLimit = createRateLimiter({ max: 5, dayMax: 20 });

// Validación del lead entrante. El backend NUNCA confía en el cliente.
const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(80),
  business: z.string().trim().max(120).optional().default(''),
  contact: z.string().trim().min(3, 'Contacto inválido').max(120),
  message: z.string().trim().min(5, 'Mensaje muy corto').max(1000),
  // Honeypot anti-spam: debe llegar vacío.
  website: z.string().max(200).optional().default(''),
});

// Validación de la actualización (al menos un campo).
const updateSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((d) => d.status !== undefined || d.notes !== undefined, {
    message: 'Nada para actualizar.',
  });

// POST /api/leads — público (con rate limit por IP)
router.post('/', rateLimit, async (req, res, next) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const lead = parsed.data;

    // Honeypot lleno = bot: respondemos OK pero NO guardamos.
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

    // Aviso al equipo. Fire-and-forget: no esperamos ni dejamos que un fallo
    // de notificación afecte la respuesta al visitante.
    notifyNewLead(lead).catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[notify] error notificando lead:', e?.message || e);
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/leads — admin. Soporta ?status= y ?q= (búsqueda).
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    const { status, q } = req.query;
    if (status && LEAD_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }
    if (q && typeof q === 'string') {
      // Saneamos la búsqueda: quitamos caracteres que romperían el filtro .or()
      const term = q.replace(/[%,()]/g, ' ').trim().slice(0, 60);
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,business.ilike.%${term}%,contact.ilike.%${term}%,message.ilike.%${term}%`
        );
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leads/:id — admin. Actualiza estado y/o notas.
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { data, error } = await supabase
      .from('leads')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Lead no encontrado.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
