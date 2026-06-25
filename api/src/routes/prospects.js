/**
 * Rutas de PROSPECTOS (formulario de contacto web).
 *
 *   POST /api/prospects  -> público. Recibe el formulario, valida, guarda en
 *                           Supabase y dispara el webhook de n8n.
 *
 * Flujo:
 *   1. Honeypot: si `website` viene con valor, respondemos 200 sin guardar.
 *   2. Rate limit por IP (~5 peticiones/minuto, en memoria).
 *   3. Validación con Zod (nombre y email obligatorios; resto opcional).
 *   4. Insert en Supabase (tabla `prospectos`). Si falla → 500 y no se notifica.
 *   5. Webhook n8n fire-and-forget. Si falla → se loguea pero se responde 200.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';

const router = Router();

// ─── Rate limiter en memoria ──────────────────────────────────────────────────
// Estructura: Map<ip, { count, resetAt }>
// Alcanza para una instancia single-process (Render free tier / hobby).
const RATE_WINDOW_MS = 60_000; // 1 minuto
const RATE_MAX = 5;            // intentos por ventana
const _ipMap = new Map();

// Limpieza periódica para no acumular IPs que ya pasaron su ventana.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _ipMap) {
    if (now >= entry.resetAt) _ipMap.delete(ip);
  }
}, RATE_WINDOW_MS);

function isRateLimited(ip) {
  const now = Date.now();
  const entry = _ipMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    _ipMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_MAX) return true;

  entry.count += 1;
  return false;
}

// ─── Esquema de validación ────────────────────────────────────────────────────
const prospectSchema = z.object({
  nombre:   z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
  email:    z.string().trim().email('Email inválido.').max(200),
  telefono: z.string().trim().max(30).optional().default(''),
  rubro:    z.string().trim().max(120).optional().default(''),
  mensaje:  z.string().trim().max(2000).optional().default(''),
  // Honeypot: un humano nunca lo completa (campo oculto en el form).
  website:  z.string().max(200).optional().default(''),
});

// ─── POST /api/prospects — público ───────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    // 1. Honeypot: si tiene valor = bot → 200 silencioso, sin guardar nada.
    const rawWebsite = req.body?.website;
    if (rawWebsite && String(rawWebsite).trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    // 2. Rate limit por IP.
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ message: 'Demasiados intentos. Esperá un momento.' });
    }

    // 3. Validación.
    const parsed = prospectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data;

    // 4. Guardar en Supabase. Si falla, no disparamos el webhook.
    const { data: inserted, error: dbError } = await supabase
      .from('prospectos')
      .insert({
        nombre:   data.nombre,
        email:    data.email,
        telefono: data.telefono || null,
        rubro:    data.rubro    || null,
        mensaje:  data.mensaje  || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 5. Webhook n8n — fire-and-forget.
    //    El prospecto ya está guardado; un fallo de notificación NO afecta la respuesta.
    if (config.n8n.webhookUrl) {
      fetch(config.n8n.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lince-secret': config.n8n.webhookSecret,
        },
        body: JSON.stringify(inserted),
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[prospects] error disparando webhook n8n:', e?.message || e);
      });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
