/**
 * Tokens de acceso del servidor MCP (`lmcp_...`).
 *
 * Los clientes MCP (Claude Desktop, Claude Code, Cursor, etc.) no pueden hacer
 * el login interactivo de Supabase, y el JWT de sesión expira cada hora. Por
 * eso cada socio genera un token de larga vida desde el Startup OS y lo pega
 * una sola vez en la configuración de su cliente.
 *
 * Diseño:
 *   · El token en claro es `lmcp_` + 32 bytes aleatorios (base64url). Solo se
 *     muestra al generarlo; en la base queda únicamente su SHA-256 (hex), así
 *     que un dump de la tabla no sirve para autenticarse.
 *   · `resolveMcpToken` devuelve la MISMA forma que el login por JWT
 *     ({ user, profile }): el resto del backend no distingue de dónde vino.
 */
import crypto from 'node:crypto';
import { supabase } from '../db/supabase.js';

export const MCP_TOKEN_PREFIX = 'lmcp_';

/** `last_used_at` se refresca a lo sumo cada 5 min para no escribir por llamada. */
const LAST_USED_STALE_MS = 5 * 60 * 1000;

/** Genera un token nuevo en claro. Se persiste SOLO su hash. */
export function mintMcpToken() {
  return MCP_TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
}

/** SHA-256 hex del token en claro (lo único que se guarda/compara). */
export function hashMcpToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Resuelve un token `lmcp_` a su identidad, con la misma forma que el flujo
 * de JWT: `{ user: { id, email }, profile: { id, full_name, role } }`.
 * Devuelve null si el token no existe o está revocado.
 */
export async function resolveMcpToken(token) {
  const { data: row } = await supabase
    .from('mcp_tokens')
    .select('id, profile_id, last_used_at')
    .eq('token_hash', hashMcpToken(token))
    .is('revoked_at', null)
    .maybeSingle();
  if (!row) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', row.profile_id)
    .single();
  if (!profile) return null;

  // Marca de uso (para que el socio vea qué tokens siguen vivos y cuáles no).
  const stale =
    !row.last_used_at || Date.now() - new Date(row.last_used_at).getTime() > LAST_USED_STALE_MS;
  if (stale) {
    await supabase
      .from('mcp_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  // El email vive en auth.users, no en profiles; ninguna regla de negocio lo
  // usa (las rutas trabajan con `req.user.id`), así que va null.
  return { user: { id: profile.id, email: null }, profile };
}
