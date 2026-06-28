/** Tipos del dominio del panel admin (respuestas del backend Express). */

export const LEAD_STATUSES = [
	'nuevo',
	'contactado',
	'en_conversacion',
	'ganado',
	'descartado'
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const BUDGET_STATUSES = [
	'enviado',
	'sin_respuesta',
	'recordado',
	'ganado',
	'perdido'
] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const REVIEW_STATUSES = ['nueva', 'analizando', 'respondida'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface Lead {
	id: string;
	created_at: string;
	name: string;
	business?: string | null;
	contact: string;
	message: string;
	status: LeadStatus;
	notes?: string | null;
}

export interface Budget {
	id: string;
	sent_at?: string | null;
	created_at: string;
	customer_name: string;
	customer_contact: string;
	amount?: number | null;
	description?: string | null;
	followup_count?: number | null;
	status: BudgetStatus;
}

export interface Review {
	id: string;
	rating?: number | null;
	source?: string | null;
	author?: string | null;
	detected_at: string;
	text?: string | null;
	suggested_response?: string | null;
	priority?: 'urgente' | 'media' | 'baja' | null;
	status: ReviewStatus;
}

export interface StatGroup {
	total?: number;
	[key: string]: number | undefined;
}

export interface Stats {
	leads: StatGroup;
	budgets: StatGroup;
	reviews: StatGroup;
}

/** El backend envuelve las respuestas en { data: ... }. */
export interface ApiData<T> {
	data: T;
}
