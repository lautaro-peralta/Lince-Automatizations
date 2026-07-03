/**
 * Cabeceras de seguridad para las respuestas dinámicas (las que genera el
 * Worker en Cloudflare Pages, p. ej. el shell del panel /admin).
 *
 * Cloudflare Pages NO aplica `static/_headers` a las respuestas de Functions:
 * ese archivo solo cubre los assets estáticos y las páginas prerenderizadas.
 * Este hook cubre el resto, con los mismos valores.
 */
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	// El panel interno no debe indexarse en buscadores.
	if (event.url.pathname.startsWith('/admin')) {
		response.headers.set('X-Robots-Tag', 'noindex');
	}
	return response;
};
