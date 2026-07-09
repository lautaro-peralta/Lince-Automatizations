-- ============================================================================
-- Lince · Startup OS v1 — suscripciones SaaS y OKRs
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Modelo de acceso (igual que 0001/0002): RLS ON en todo, SIN políticas
-- abiertas. El navegador NO toca la base directo; todo pasa validado por la
-- API (Express con service-role).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subscriptions: inventario de suscripciones SaaS recurrentes.
--   Es un inventario editable (no una bitácora): se corrige con update y una
--   suscripción que se da de baja pasa a status 'cancelada' (queda el
--   histórico de cuánto se venía pagando).
--   `amount` es el costo POR CICLO (`billing_cycle`): el costo mensual
--   normalizado (anual / 12) se calcula en la API, no se guarda.
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                  -- ej: 'Figma Organization'
  vendor        text,                           -- proveedor / empresa
  seats         smallint not null default 1 check (seats between 1 and 10000),
  amount        numeric(12,2) not null check (amount >= 0),
  currency      text not null default 'USD' check (currency in ('ARS','USD')),
  billing_cycle text not null default 'mensual' check (billing_cycle in ('mensual','anual')),
  renews_on     date,                           -- próxima renovación (se actualiza a mano)
  status        text not null default 'activa' check (status in ('activa','pausada','cancelada')),
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists subscriptions_status_idx    on public.subscriptions (status);
create index if not exists subscriptions_renews_on_idx on public.subscriptions (renews_on);

-- ----------------------------------------------------------------------------
-- okr_objectives + okr_key_results: objetivos por trimestre con resultados
--   clave medibles. El avance de un objetivo se calcula al vuelo en la API
--   como promedio de min(current/target, 1) de sus KRs.
-- ----------------------------------------------------------------------------
create table if not exists public.okr_objectives (
  id         uuid primary key default gen_random_uuid(),
  quarter    text not null check (quarter ~ '^\d{4}-Q[1-4]$'),  -- ej: '2026-Q3'
  title      text not null,
  owner      uuid references public.profiles (id) on delete set null,
  status     text not null default 'activo' check (status in ('activo','archivado')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists okr_objectives_quarter_idx on public.okr_objectives (quarter desc, created_at);
create index if not exists okr_objectives_status_idx  on public.okr_objectives (status);

create table if not exists public.okr_key_results (
  id           uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.okr_objectives (id) on delete cascade,
  title        text not null,
  unit         text,                             -- ej: 'US$', 'clientes', '%'
  target       numeric(14,2) not null check (target > 0),
  current      numeric(14,2) not null default 0 check (current >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists okr_key_results_objective_idx on public.okr_key_results (objective_id, created_at);

-- ============================================================================
-- Row Level Security: ON, sin políticas abiertas => el acceso directo desde el
-- navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.subscriptions    enable row level security;
alter table public.okr_objectives   enable row level security;
alter table public.okr_key_results  enable row level security;
