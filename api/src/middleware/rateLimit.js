/**
 * Rate limiter en memoria por IP, con dos capas:
 *   · Ventana corta: frena ráfagas (varios envíos en segundos).
 *   · Tope diario: frena el abuso sostenido. Aunque un bot respete el ritmo por
 *     minuto, nunca superará `dayMax` envíos en 24 h, así que una misma máquina
 *     no puede inyectar cientos de registros.
 *
 * En memoria a propósito: corre una sola instancia del backend y los límites
 * son laxos; si el proceso se reinicia los contadores arrancan de cero y no
 * pasa nada grave. `createRateLimiter` fabrica middlewares INDEPENDIENTES:
 * cada endpoint que lo usa tiene su propio mapa de IPs y sus propios límites.
 *
 * Lo usan los endpoints PÚBLICOS que escriben en la base (prospects, leads,
 * chatbot): sin esto, cualquiera puede llenar el tier gratuito de Supabase o
 * quemar la cuota de notificaciones pegándole directo a la API.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {object}  opts
 * @param {number}  [opts.windowMs]   Ventana corta en ms (default 1 minuto).
 * @param {number}  [opts.max]        Peticiones por ventana corta.
 * @param {number}  [opts.dayMax]     Peticiones por IP en 24 h.
 * @param {string}  [opts.message]    Mensaje del 429 de la ventana corta.
 * @param {string}  [opts.dayMessage] Mensaje del 429 del tope diario.
 * @returns Middleware de Express.
 */
export function createRateLimiter({
  windowMs = 60_000,
  max = 5,
  dayMax = 20,
  message = 'Demasiados intentos. Esperá un momento.',
  dayMessage = 'Alcanzaste el límite de envíos por hoy. Probá de nuevo mañana.',
} = {}) {
  const ipMap = new Map();

  // Limpieza periódica: se descarta la entrada cuando venció su ventana diaria
  // (la más larga). `unref` para no mantener vivo el proceso por el timer.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipMap) {
      if (now >= entry.dayResetAt) ipMap.delete(ip);
    }
  }, windowMs);
  cleanup.unref?.();

  return function rateLimit(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = ipMap.get(ip);

    // Entrada nueva o con el día ya vencido → arranca de cero.
    if (!entry || now >= entry.dayResetAt) {
      entry = { count: 0, resetAt: now + windowMs, dayCount: 0, dayResetAt: now + DAY_MS };
      ipMap.set(ip, entry);
    }

    // Reinicio de la ventana corta sin tocar el contador diario.
    if (now >= entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    // Tope diario primero: es el que corta el abuso masivo.
    if (entry.dayCount >= dayMax) {
      return res.status(429).json({ message: dayMessage });
    }
    if (entry.count >= max) {
      return res.status(429).json({ message });
    }

    entry.count += 1;
    entry.dayCount += 1;
    next();
  };
}
