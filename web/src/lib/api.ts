/**
 * Cliente HTTP mínimo hacia el backend de Lince (Express en Render).
 *
 * La URL base se lee de una variable pública de SvelteKit (PUBLIC_API_URL).
 * Usamos `$env/dynamic/public` para que sea opcional: en dev cae al backend
 * local sin romper el build si la variable no está definida.
 */
import { env } from '$env/dynamic/public';

const API_URL = (env.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export interface ApiOptions {
	method?: string;
	body?: unknown;
	/** JWT opcional (rutas del panel admin). */
	token?: string | null;
}

/** Error de API con metadatos del backend. */
export interface ApiError extends Error {
	status: number;
	data?: unknown;
}

/**
 * Realiza una petición JSON al backend.
 * @throws {ApiError} Con `.status` y `.data` si el backend responde con error,
 *   o `.status === 0` si falla la red (cold start de Render, sin conexión…).
 */
export async function apiFetch<T = unknown>(
	path: string,
	{ method = 'GET', body, token }: ApiOptions = {}
): Promise<T> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;

	let res: Response;
	try {
		res = await fetch(`${API_URL}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined
		});
	} catch (networkErr) {
		// El servidor de Render puede estar "despertando" (cold start) o sin red.
		const err = new Error(
			'No pudimos conectar con el servidor. Reintentá en un momento.'
		) as ApiError;
		err.cause = networkErr;
		err.status = 0;
		throw err;
	}

	// Algunas respuestas (ej. 204) no traen cuerpo.
	const text = await res.text();
	const data = text ? safeJson(text) : null;

	if (!res.ok) {
		const message =
			(data && typeof data === 'object' && 'message' in data
				? String((data as { message: unknown }).message)
				: null) || `Error ${res.status}`;
		const err = new Error(message) as ApiError;
		err.status = res.status;
		err.data = data;
		throw err;
	}
	return data as T;
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return { message: text };
	}
}

export { API_URL };
