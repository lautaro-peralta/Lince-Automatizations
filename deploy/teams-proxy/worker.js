/**
 * Reverse-proxy de Lince Teams.
 *
 * Enruta  https://lince-automate.com.ar/teams/*  →  el servicio Python de
 * Lince Teams (repo `lince-teams`, desplegado en Render). Así Teams vive en el
 * MISMO origen que el panel `/admin`, y por lo tanto comparte su sesión de
 * Supabase (que se guarda en `localStorage`, que es por-origen): el usuario no
 * vuelve a iniciar sesión.
 *
 * Reenvía todo tal cual —incluido el `Upgrade` del WebSocket (`/teams/ws`), que
 * es lo que da el tiempo real de la pizarra— quitando solo el prefijo `/teams`.
 *
 * Deploy: `wrangler deploy` desde esta carpeta (ver README.md). La ruta
 * `/teams/*` es más específica que el custom domain del sitio, así que gana.
 */
export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// Quita el prefijo /teams (dejando "/" para la raíz) y arma la URL destino.
		const rest = url.pathname.replace(/^\/teams(?=\/|$)/, '') || '/';
		const target = new URL(rest + url.search, env.TEAMS_ORIGIN);
		// Reconstruir la request preserva método, headers y el handshake del WS.
		return fetch(new Request(target, request));
	},
};
