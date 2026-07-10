/**
 * Hook del servidor (Worker de Cloudflare):
 *   1. Reverse-proxy de Lince Teams: /teams/* → el servicio Python (por el túnel
 *      de Cloudflare), en el MISMO origen que el panel para compartir la sesión
 *      de Supabase. Se hace ACÁ —dentro del Worker del sitio, que es dueño del
 *      hostname— porque un Worker aparte en una "route" no le gana al custom
 *      domain. Incluye el WebSocket (/teams/ws) del tiempo real.
 *   2. Cabeceras de seguridad para las respuestas dinámicas (las que genera el
 *      Worker, p. ej. el shell del panel /admin), que `static/_headers` no cubre.
 *
 * `TEAMS_ORIGIN` es el hostname público del túnel (p. ej.
 * https://teams-origin.lince-automate.com.ar). Se define en `wrangler.jsonc`
 * (vars) o en el dashboard del Worker.
 */
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	// ── Reverse-proxy de /teams → servicio de Lince Teams ──────────────────────
	const teamsOrigin = env.TEAMS_ORIGIN;
	if (teamsOrigin && (pathname === '/teams' || pathname.startsWith('/teams/'))) {
		// `search` se lee acá dentro y no arriba: /teams nunca se prerenderiza, y
		// tocar url.search en el prerender de la landing lo rompe.
		const search = event.url.search;
		// Sin barra final, el navegador resolvería los assets relativos
		// (app.js, config.js…) contra la raíz. Redirigimos a /teams/.
		if (pathname === '/teams') {
			return new Response(null, { status: 308, headers: { location: '/teams/' + search } });
		}
		// Quita el prefijo /teams y reenvía al origen (túnel). new Request(...)
		// preserva método, headers y el handshake del WebSocket.
		const rest = pathname.replace(/^\/teams/, '') || '/';
		const target = new URL(rest + search, teamsOrigin);
		return fetch(new Request(target, event.request));
	}

	// ── Resto: respuesta normal del panel/landing + cabeceras de seguridad ─────
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	// El panel interno no debe indexarse en buscadores.
	if (pathname.startsWith('/admin')) {
		response.headers.set('X-Robots-Tag', 'noindex');
	}
	return response;
};
