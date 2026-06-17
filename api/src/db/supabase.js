/**
 * Cliente de Supabase para el SERVIDOR, con la service-role key.
 *
 * Esta clave bypassa Row Level Security: por eso vive solo en el backend y
 * NUNCA debe llegar al navegador. Toda escritura/lectura sensible del CRM
 * pasa por acá, con la validación y los permisos que aplica Express.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Placeholders válidos para que el server arranque aunque falten las variables
// (ej. en local sin .env): así /health sigue vivo. En producción, las
// variables reales de Render sobreescriben estos valores. Si faltan, config.js
// ya dejó un warning y cualquier query real fallará de forma controlada.
const url = config.supabaseUrl || 'http://localhost:54321';
const key = config.supabaseServiceKey || 'service-role-placeholder';

export const supabase = createClient(
  url,
  key,
  {
    auth: {
      // El backend no maneja sesiones de usuario: cada request es sin estado.
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
