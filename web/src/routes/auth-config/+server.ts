import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

/**
 * Config pública para el Startup OS (`web/static/startup-os/`, un archivo
 * estático que no puede leer `$env`). Devuelve la MISMA URL + anon key que usa
 * el panel /admin, tomadas del entorno en runtime, para que nunca se
 * desincronicen (misma tabla de usuarios) y no haya nada hardcodeado.
 *
 * Son valores PÚBLICOS: la anon key ya viaja en el bundle del panel y por sí
 * sola no da acceso a nada (lo protege RLS). Por eso es seguro exponerlos.
 */
export const prerender = false;

export function GET() {
	return json({
		supabaseUrl: env.PUBLIC_SUPABASE_URL ?? '',
		supabaseAnonKey: env.PUBLIC_SUPABASE_ANON_KEY ?? '',
		apiUrl: env.PUBLIC_API_URL ?? ''
	});
}
