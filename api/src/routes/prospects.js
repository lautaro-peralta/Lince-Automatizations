/**
 * Rutas de PROSPECTOS (formulario de contacto web).
 *
 *   POST /api/prospects  -> público. Recibe el formulario, valida, guarda en
 *                           Supabase y dispara el webhook de n8n.
 *
 * Flujo:
 *   1. Honeypot: si `website` viene con valor, respondemos 200 sin guardar.
 *   2. Rate limit por IP (en memoria): ~5 peticiones/minuto (ráfaga) y un tope
 *      diario para frenar el abuso sostenido (que una misma máquina no pueda
 *      inyectar cientos de formularios).
 *   3. Validación con Zod (nombre obligatorio; email o telefono al menos uno).
 *   4. Insert en Supabase (tabla `leads`, la misma que lee el panel admin y
 *      /api/stats). Si falla → 500 y no se notifica.
 *   5. Webhook n8n fire-and-forget. Si falla → se loguea pero se responde 201.
 */
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { notifyProspect } from '../lib/notify.js';

const router = Router();

// ─── Rate limiter en memoria (dos capas por IP) ───────────────────────────────
//   · Ventana corta: frena ráfagas (varios envíos en segundos).
//   · Tope diario: frena el abuso sostenido. Aunque un bot respete el ritmo por
//     minuto (5/min = miles/día), nunca superará RATE_MAX_DAY envíos en 24 h, así
//     que una misma máquina no puede inyectar cientos de formularios.
const RATE_WINDOW_MS = 60_000; // 1 minuto
const RATE_MAX = 5; // intentos por ventana corta
const RATE_DAY_MS = 24 * 60 * 60 * 1000; // 24 horas
const RATE_MAX_DAY = 20; // envíos máximos por IP en 24 h
const _ipMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _ipMap) {
    // Se descarta la entrada cuando venció su ventana diaria (la más larga).
    if (now >= entry.dayResetAt) _ipMap.delete(ip);
  }
}, RATE_WINDOW_MS);

// Devuelve null si la petición pasa, o el mensaje 429 si excede algún límite.
function rateLimit(ip) {
  const now = Date.now();
  let entry = _ipMap.get(ip);

  // Entrada nueva o con el día ya vencido → arranca de cero.
  if (!entry || now >= entry.dayResetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS, dayCount: 0, dayResetAt: now + RATE_DAY_MS };
    _ipMap.set(ip, entry);
  }

  // Reinicio de la ventana corta sin tocar el contador diario.
  if (now >= entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }

  // Tope diario primero: es el que corta el abuso masivo.
  if (entry.dayCount >= RATE_MAX_DAY) {
    return 'Alcanzaste el límite de envíos por hoy. Escribinos por WhatsApp o probá de nuevo mañana.';
  }
  if (entry.count >= RATE_MAX) {
    return 'Demasiados intentos. Esperá un momento.';
  }

  entry.count += 1;
  entry.dayCount += 1;
  return null;
}

// ─── Esquema de validación: nombre obligatorio. email y telefono opcionales,
// pero se exige que al menos uno de los dos venga presente y no vacío.
const prospectSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
    // email opcional; si viene, comprobamos formato simple.
    email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: 'Email inválido.',
      }),
    telefono: z.string().trim().max(30).optional(),
    empresa: z.string().trim().max(120).optional(),
    mensaje: z.string().trim().max(2000).optional().default(''),
    // Honeypot
    website: z.string().max(200).optional().default(''),
  })
  .refine((d) => {
    const hasEmail = typeof d.email === 'string' && d.email.trim().length > 0;
    const hasPhone = typeof d.telefono === 'string' && d.telefono.trim().length > 0;
    return hasEmail || hasPhone;
  }, {
    message: 'Se requiere email o teléfono.',
    path: ['email'],
  });

// ─── POST /api/prospects — público ───────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    // 1. Honeypot: si tiene valor = bot → 200 silencioso, sin guardar nada.
    const rawWebsite = req.body?.website;
    if (rawWebsite && String(rawWebsite).trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    // 2. Rate limit por IP (ráfaga + tope diario).
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const limitMsg = rateLimit(ip);
    if (limitMsg) {
      return res.status(429).json({ message: limitMsg });
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

    // 4. Guardar en `leads` (la tabla canónica: la lee /admin/leads y /api/stats).
    //    `contact` es una sola columna NOT NULL, así que email y teléfono se
    //    combinan; la validación ya garantizó que al menos uno está presente.
    const email = data.email && data.email.trim() !== '' ? data.email : null;
    const telefono = data.telefono && data.telefono.trim() !== '' ? data.telefono : null;
    const { data: inserted, error: dbError } = await supabase
      .from('leads')
      .insert({
        name: data.nombre,
        business: data.empresa && data.empresa.trim() !== '' ? data.empresa : null,
        contact: [email, telefono].filter(Boolean).join(' · '),
        message: data.mensaje || '',
        source: 'landing',
        status: 'nuevo',
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 5. Notificación fire-and-forget (n8n/webhook/email, según .env). El
    //    payload conserva las claves del prospecto original para no romper el
    //    mapeo del workflow "Registro de prospectos" en n8n.
    notifyProspect({
      id: inserted.id,
      nombre: data.nombre,
      email,
      telefono,
      empresa: data.empresa && data.empresa.trim() !== '' ? data.empresa : null,
      mensaje: data.mensaje || '',
      created_at: inserted.created_at,
    }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[prospects] error notificando prospecto:', e?.message || e);
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
