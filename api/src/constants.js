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
