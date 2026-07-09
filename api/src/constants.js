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

// Un gasto es "crítico" cuando su monto SUPERA el umbral de su moneda: ahí hacen
// falta 2 aprobaciones de socios distintos. Con un monto igual o menor, alcanza
// con 1. Los umbrales son por moneda porque 50 USD y 50.000 ARS no son lo mismo.
export const APPROVAL_THRESHOLDS = { USD: 50, ARS: 50000 };

// Devuelve el umbral crítico para una moneda (USD por defecto).
export function approvalThreshold(currency) {
  return APPROVAL_THRESHOLDS[currency] ?? APPROVAL_THRESHOLDS.USD;
}

export const AD_CHANNELS = ['meta', 'google', 'linkedin', 'tiktok', 'otros'];

export const CURRENCIES = ['ARS', 'USD'];

export const SUBSCRIPTION_STATUSES = ['activa', 'pausada', 'cancelada'];

export const BILLING_CYCLES = ['mensual', 'anual'];

export const OKR_STATUSES = ['activo', 'archivado'];

export const CLIENT_STATUSES = ['activo', 'pausado', 'baja'];

export const CLIENT_HEALTH = ['saludable', 'en_riesgo', 'critico'];

export const INVOICE_STATUSES = ['borrador', 'enviada', 'pagada', 'vencida', 'anulada'];

export const ROADMAP_STATUSES = ['idea', 'planeado', 'en_curso', 'hecho', 'pausado'];
