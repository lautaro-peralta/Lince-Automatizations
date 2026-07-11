/**
 * Middleware de autenticación para las rutas protegidas.
 *
 * Acepta DOS credenciales por `Authorization: Bearer <token>`:
 *   · El JWT de Supabase Auth del frontend (panel admin o Startup OS).
 *   · Un token MCP de larga vida (`lmcp_...`), generado por un socio para que
 *     Claude u otro cliente MCP opere en su nombre (ver lib/mcpTokens.js).
 *
 * En ambos casos:
 *   1. Validamos el token (Supabase getUser, o hash contra `mcp_tokens`).
 *   2. Cargamos su fila de `profiles` (1 por usuario de auth) para leer el rol.
 *   3. Comprobamos que el rol esté permitido para la ruta.
 * Si algo falla, cortamos con 401/403.
 *
 * `req.user` (usuario de auth) y `req.profile` (`{ id, full_name, role }`) quedan
 * disponibles para la ruta.
 */
import { supabase } from '../db/supabase.js';
import { MCP_TOKEN_PREFIX, resolveMcpToken } from '../lib/mcpTokens.js';

/**
 * Resuelve un Bearer token (JWT de Supabase o token MCP) a su identidad,
 * SIN tocar la respuesta HTTP: lo usan tanto el middleware como /mcp.
 * @returns {Promise<{user: object, profile: object|null} | null>}
 */
export async function resolveToken(token) {
  if (!token) return null;

  // Token MCP de larga vida (formato propio, ver lib/mcpTokens.js).
  if (token.startsWith(MCP_TOKEN_PREFIX)) {
    return resolveMcpToken(token);
  }

  // Valida el JWT y obtiene el usuario dueño del token.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', data.user.id)
    .single();

  return { user: data.user, profile: profile || null };
}

/**
 * Valida el token del request y carga el profile. Si algo falla, responde y
 * devuelve null.
 * @returns {Promise<{user: object, profile: object} | null>}
 */
async function resolveUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: 'Falta el token de acceso.' });
    return null;
  }

  const resolved = await resolveToken(token);
  if (!resolved) {
    res.status(401).json({ message: 'Sesión inválida o expirada.' });
    return null;
  }
  return resolved;
}

/**
 * Fabrica un middleware que exige que el rol del usuario esté en `roles`.
 * @param {string[]} roles  Roles permitidos, ej. ['admin'] o ['socio','admin'].
 * @param {string}   denied Mensaje del 403.
 */
function requireRole(roles, denied) {
  return async function (req, res, next) {
    try {
      const resolved = await resolveUser(req, res);
      if (!resolved) return; // resolveUser ya respondió
      const { user, profile } = resolved;
      if (!profile || !roles.includes(profile.role)) {
        return res.status(403).json({ message: denied });
      }
      req.user = user;
      req.profile = profile;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Solo administradores del panel. */
export const requireAdmin = requireRole(['admin'], 'No tenés permisos de administrador.');

/** Socios del Startup OS (y admins, que son superconjunto). */
export const requireSocio = requireRole(
  ['socio', 'admin'],
  'No tenés acceso al Startup OS.'
);
