/**
 * Cliente de Supabase para el navegador (SOLO lo usa el panel admin).
 *
 * Usa la clave ANÓNIMA (anon key), que está pensada para exponerse en el
 * frontend: por sí sola no da acceso a nada, porque las tablas están
 * protegidas por Row Level Security (RLS) en Supabase. Acá solo la usamos
 * para el login/logout (Supabase Auth). Las lecturas/escrituras sensibles
 * pasan por el backend de Express con la service-role key.
 *
 * La landing pública NO importa este módulo: no necesita Supabase.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Aviso temprano y claro si faltan las variables de entorno.
  console.warn(
    '[admin] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copiá web/.env.example a web/.env y completá los valores.'
  );
}

// Placeholders válidos para que el módulo no rompa si faltan las variables
// (el warning de arriba avisa). Con las variables reales, todo funciona.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'anon-placeholder');
