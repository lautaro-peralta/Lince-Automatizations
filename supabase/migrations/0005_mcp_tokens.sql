-- ============================================================================
-- Lince · Startup OS — tokens de acceso para el servidor MCP (IA)
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Qué es: el endpoint /mcp de la API deja que Claude (u otro cliente MCP)
-- opere el Startup OS "como" un socio. Los JWT de Supabase expiran cada hora,
-- así que cada socio genera acá un token de larga vida (formato `lmcp_...`)
-- desde la vista "Conectar IA" del Startup OS.
--
-- Seguridad:
--   · NUNCA se guarda el token en claro: solo su hash SHA-256 (hex). El token
--     se muestra una única vez al generarlo.
--   · Cada token pertenece a un socio (profile) y hereda exactamente sus
--     permisos: las reglas anti-fraude (no aprobar el propio gasto, etc.)
--     aplican igual que en la app.
--   · Revocar = poner `revoked_at`; la fila queda como registro de auditoría.
--
-- Modelo de acceso (igual que 0001..0004): RLS ON, SIN políticas abiertas.
-- El navegador NO toca la base directo; todo pasa por la API (service-role).
-- ============================================================================

create table if not exists public.mcp_tokens (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  label        text not null,                 -- ej: 'Claude Desktop de Lautaro'
  token_hash   text not null unique,          -- SHA-256 (hex) del token en claro
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,                   -- se refresca con uso (a lo sumo cada 5 min)
  revoked_at   timestamptz                    -- null = vigente
);

create index if not exists mcp_tokens_profile_idx on public.mcp_tokens (profile_id);

-- ============================================================================
-- Row Level Security: ON, sin políticas abiertas => el acceso directo desde el
-- navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.mcp_tokens enable row level security;
