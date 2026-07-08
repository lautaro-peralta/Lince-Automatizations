/**
 * Constantes compartidas del dominio (estados válidos de cada entidad).
 * Tener una sola fuente de verdad evita typos y mantiene la validación zod
 * y los chequeos coherentes en todo el backend.
 */
export const LEAD_STATUSES = [
  'nuevo',
  'contactado',
  'en_conversacion',
  'ganado',
  'descartado',
];

export const BUDGET_STATUSES = [
  'enviado',
  'sin_respuesta',
  'recordado',
  'ganado',
  'perdido',
];

export const REVIEW_STATUSES = ['nueva', 'analizando', 'respondida'];

// ─── Startup OS ─────────────────────────────────────────────────────────────

export const EXPENSE_STATUSES = ['pendiente', 'aprobado', 'rechazado'];

export const EXPENSE_CATEGORIES = [
  'Publicidad',
  'Software/SaaS',
  'Hardware',
  'Viáticos',
  'Servicios profesionales',
  'Otros',
];

// A partir de este monto (en la moneda del gasto) hacen falta 2 aprobaciones
// de socios distintos. Por debajo, alcanza con 1.
export const APPROVAL_THRESHOLD = 1000;

export const AD_CHANNELS = ['meta', 'google', 'linkedin', 'tiktok', 'otros'];

export const CURRENCIES = ['ARS', 'USD'];

export const SUBSCRIPTION_STATUSES = ['activa', 'pausada', 'cancelada'];

export const BILLING_CYCLES = ['mensual', 'anual'];

export const OKR_STATUSES = ['activo', 'archivado'];
