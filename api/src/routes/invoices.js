/**
 * Rutas de FACTURACIÓN del Startup OS.
 *
 *   GET    /api/invoices      -> socio. Listado (más recientes primero).
 *   POST   /api/invoices       -> socio. Emite una factura (borrador o enviada).
 *   PATCH  /api/invoices/:id    -> socio. Edición y cambio de estado (marcar pagada, etc.).
 *   DELETE /api/invoices/:id    -> socio. Borra (para altas erradas; anular de
 *                                verdad se hace con status 'anulada').
 *
 * `client_name` se guarda como snapshot al emitir para no perder la referencia
 * si el cliente se da de baja física. Cobranzas pendientes = 'enviada' + 'vencida'.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { INVOICE_STATUSES, CURRENCIES } from '../constants.js';

const router = Router();

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usá YYYY-MM-DD).')
  .nullish();

const createSchema = z.object({
  client_id: z.string().uuid().nullish(),
  client_name: z.string().trim().min(2).max(160),
  number: z.string().trim().max(60).nullish(),
  amount: z.number().nonnegative().max(1_000_000_000),
  currency: z.enum(CURRENCIES).default('USD'),
  status: z.enum(INVOICE_STATUSES).default('borrador'),
  issued_on: dateField,
  due_on: dateField,
  notes: z.string().trim().max(1000).nullish(),
});

const updateSchema = z
  .object({
    client_id: z.string().uuid().nullish(),
    client_name: z.string().trim().min(2).max(160).optional(),
    number: z.string().trim().max(60).nullish(),
    amount: z.number().nonnegative().max(1_000_000_000).optional(),
    currency: z.enum(CURRENCIES).optional(),
    status: z.enum(INVOICE_STATUSES).optional(),
    issued_on: dateField,
    due_on: dateField,
    notes: z.string().trim().max(1000).nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nada para actualizar.' });

// GET /api/invoices — socio
router.get('/', requireSocio, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('issued_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices — socio
router.post('/', requireSocio, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('invoices')
      .insert({ ...parsed.data, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/invoices/:id — socio
router.patch('/:id', requireSocio, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Factura no encontrada.' });
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/invoices/:id — socio
router.delete('/:id', requireSocio, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Factura no encontrada.' });
    return res.json({ data: { id: data.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
