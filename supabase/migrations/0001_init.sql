-- ============================================================================
-- Lince · Migración inicial del CRM
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Modelo de acceso:
--   El backend (Express) usa la SERVICE-ROLE key, que IGNORA las políticas
--   RLS. Por eso habilitamos RLS en todas las tablas y NO creamos políticas
--   abiertas: el acceso directo desde el navegador queda denegado por defecto
--   y todo pasa, validado, por la API. (Defensa en profundidad.)
-- ============================================================================

-- gen_random_uuid() viene de pgcrypto (Supabase ya lo trae habilitado).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- profiles: 1 fila por usuario de Supabase Auth. Guarda el ROL.
--   El primer admin se setea a mano (ver supabase/README.md).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       text not null default 'viewer',  -- 'admin' | 'viewer'
  created_at timestamptz not null default now()
);

-- Cuando se crea un usuario en auth, le creamos su profile automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- businesses: negocios cliente. Base multi-negocio para demos / CRM / reseñas.
-- ----------------------------------------------------------------------------
create table if not exists public.businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,            -- ej: 'parrilla-el-fogon'
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- leads: contactos capturados por el formulario de la landing. (Fase 1)
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  business   text,                            -- texto libre que escribe el lead
  contact    text not null,                   -- email o WhatsApp
  message    text not null,
  source     text not null default 'landing',
  status     text not null default 'nuevo',   -- nuevo|contactado|en_conversacion|ganado|descartado
  notes      text,                            -- notas internas del equipo
  created_at timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

-- ----------------------------------------------------------------------------
-- chatbot_flows: el árbol de conversación como DATO (no hardcodeado). (Fase 3)
-- ----------------------------------------------------------------------------
create table if not exists public.chatbot_flows (
  id         uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  slug       text not null,
  name       text not null,
  tree       jsonb not null,                  -- el árbol de nodos del bot
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);

-- chatbot_sessions: una conversación de un visitante. (Fase 3)
create table if not exists public.chatbot_sessions (
  id           uuid primary key default gen_random_uuid(),
  flow_id      uuid references public.chatbot_flows (id) on delete set null,
  current_node text,
  state        jsonb not null default '{}'::jsonb,  -- datos recolectados (slots)
  completed    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- chatbot_messages: log de mensajes por sesión (analítica). (Fase 3)
create table if not exists public.chatbot_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chatbot_sessions (id) on delete cascade,
  role       text not null,                   -- 'bot' | 'user'
  text       text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- budgets: presupuestos enviados, con su seguimiento. (Fase 4)
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references public.businesses (id) on delete cascade,
  customer_name   text not null,
  customer_contact text not null,
  amount          numeric(12,2),
  description     text,
  sent_at         timestamptz not null default now(),
  status          text not null default 'enviado', -- enviado|sin_respuesta|recordado|ganado|perdido
  last_followup_at timestamptz,
  followup_count  integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists budgets_status_idx on public.budgets (status);

-- budget_followups: log de cada recordatorio enviado por el cron. (Fase 4)
create table if not exists public.budget_followups (
  id         uuid primary key default gen_random_uuid(),
  budget_id  uuid not null references public.budgets (id) on delete cascade,
  channel    text not null,                   -- 'whatsapp' | 'email'
  message    text,
  sent_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- reviews: reseñas detectadas para el monitor en vivo. (Fase 3/5)
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid references public.businesses (id) on delete cascade,
  source            text not null,            -- 'google' | 'instagram' | ...
  rating            integer,                  -- 1..5
  author            text,
  text              text,
  status            text not null default 'nueva', -- nueva|analizando|respondida
  priority          text,                     -- baja|media|urgente
  suggested_response text,
  detected_at       timestamptz not null default now(),
  responded_at      timestamptz
);
create index if not exists reviews_status_idx on public.reviews (status);

-- ============================================================================
-- Row Level Security: ON en todo. Sin políticas abiertas => el acceso directo
-- desde el navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.businesses        enable row level security;
alter table public.leads             enable row level security;
alter table public.chatbot_flows     enable row level security;
alter table public.chatbot_sessions  enable row level security;
alter table public.chatbot_messages  enable row level security;
alter table public.budgets           enable row level security;
alter table public.budget_followups  enable row level security;
alter table public.reviews           enable row level security;

-- Única política directa: un usuario logueado puede leer SU propio profile
-- (útil si el panel admin quiere mostrar su rol sin pasar por la API).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);
