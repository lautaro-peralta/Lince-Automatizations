/**
 * Middleware de autenticación para rutas del panel admin.
 *
 * El panel (frontend) hace login con Supabase Auth y obtiene un JWT. Lo manda
 * en `Authorization: Bearer <token>`. Acá:
 *   1. Validamos el token contra Supabase (getUser).
 *   2. Comprobamos que el usuario tenga rol 'admin' en la tabla `profiles`.
 * Si algo falla, cortamos con 401/403.
 */
import { supabase } from '../db/supabase.js';

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Falta el token de acceso.' });
    }

    // Valida el JWT y obtiene el usuario dueño del token.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Sesión inválida o expirada.' });
    }

    // El rol vive en la tabla `profiles` (1 fila por usuario de auth).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'No tenés permisos de administrador.' });
    }

    req.user = data.user; // queda disponible para la ruta
    next();
  } catch (err) {
    next(err);
  }
}
