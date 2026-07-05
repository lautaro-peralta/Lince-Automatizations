-- ============================================================================
-- Lince · Startup OS — gastos y aprobaciones + métricas de anuncios
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Modelo de acceso (igual que 0001): RLS ON en todo, SIN políticas abiertas.
-- El navegador NO toca la base directo; todo pasa validado por la API (Express
-- con service-role) que aplica las reglas anti-fraude en el servidor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Rol 'socio'
--   `profiles.role` ya es text (0001). Sumamos el valor 'socio' para los
--   integrantes del Startup OS. Se promueve a mano, igual que el primer admin:
--
--   update public.profiles set role = 'socio'
--   where id in (select id from auth.users
--                where email in ('vos@...','ian@...','agustin@...'));
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- expenses: cada compra/gasto que registra un socio.
--   `status` lo mantiene SOLO el servidor a partir de los eventos.
--   `required_approvals` se fija al insertar según el monto vs. el umbral.
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id                 uuid primary key default gen_random_uuid(),
  amount             numeric(12,2) not null check (amount >= 0),
  currency           text not null default 'ARS',
  category           text not null,
  description        text not null,
  provider           text,                     -- proveedor / comercio
  receipt_url        text,                     -- link o referencia del comprobante
  registered_by      uuid not null references public.profiles (id) on delete restrict,
  required_approvals smallint not null default 1 check (required_approvals between 1 and 2),
  status             text not null default 'pendiente', -- pendiente|aprobado|rechazado
  created_at         timestamptz not null default now()
);
create index if not exists expenses_status_idx     on public.expenses (status);
create index if not exists expenses_created_at_idx  on public.expenses (created_at desc);

-- ----------------------------------------------------------------------------
-- expense_events: bitácora APPEND-ONLY de un gasto (auditoría anti-fraude).
--   La API nunca expone update/delete sobre esta tabla: la historia es inmutable.
-- ----------------------------------------------------------------------------
create table if not exists public.expense_events (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  actor      uuid not null references public.profiles (id) on delete restrict,
  action     text not null,                   -- registrado|aprobado|rechazado
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists expense_events_expense_idx on public.expense_events (expense_id, created_at);

-- Un mismo socio no puede aprobar dos veces el mismo gasto (refuerzo en DB de la
-- regla de "aprobadores distintos"; la API también lo valida antes de insertar).
create unique index if not exists expense_events_unique_approval
  on public.expense_events (expense_id, actor)
  where action = 'aprobado';

-- ----------------------------------------------------------------------------
-- ad_metrics: métricas de anuncios cargadas a mano por canal y período (mes).
--   Editables (no es bitácora): ROAS/CAC se calculan al vuelo desde acá.
-- ----------------------------------------------------------------------------
create table if not exists public.ad_metrics (
  id          uuid primary key default gen_random_uuid(),
  period      date not null,                   -- primer día del mes que representa
  channel     text not null,                   -- meta|google|linkedin|tiktok|otros
  spend       numeric(12,2) not null default 0 check (spend >= 0),
  revenue     numeric(12,2) not null default 0 check (revenue >= 0),
  conversions integer not null default 0 check (conversions >= 0),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (period, channel)
);
create index if not exists ad_metrics_period_idx on public.ad_metrics (period desc);

-- ============================================================================
-- Row Level Security: ON, sin políticas abiertas => el acceso directo desde el
-- navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.expenses        enable row level security;
alter table public.expense_events  enable row level security;
alter table public.ad_metrics      enable row level security;
