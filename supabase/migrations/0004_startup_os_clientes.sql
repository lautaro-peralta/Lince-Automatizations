-- ============================================================================
-- Lince · Startup OS v1.1 — clientes (CRM + salud), facturación y roadmap
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Modelo de acceso (igual que 0001/0002/0003): RLS ON en todo, SIN políticas
-- abiertas. El navegador NO toca la base directo; todo pasa validado por la
-- API (Express con service-role).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- clients: cartera de clientes ACTIVOS de la agencia (distinto de `leads`, que
--   son prospectos entrantes de la landing). Un lead ganado se "gradúa" a
--   cliente cargándolo acá. `mrr` es el ingreso recurrente mensual real: de
--   acá sale el MRR del dashboard. `health` alimenta el riesgo de churn.
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  contact    text,                     -- email / WhatsApp / persona de contacto
  plan       text,                     -- texto libre: 'Scale', 'Growth', etc.
  mrr        numeric(12,2) not null default 0 check (mrr >= 0),
  currency   text not null default 'USD' check (currency in ('ARS','USD')),
  status     text not null default 'activo' check (status in ('activo','pausado','baja')),
  health     text not null default 'saludable' check (health in ('saludable','en_riesgo','critico')),
  since      date,                     -- cliente desde
  notes      text,                     -- señales, contexto, próximo paso
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_health_idx on public.clients (health);

-- ----------------------------------------------------------------------------
-- invoices: facturas emitidas a clientes. `client_name` es un snapshot para no
--   perder la referencia si el cliente se borra (FK on delete set null).
--   Cobranzas pendientes = suma de 'enviada' + 'vencida'.
-- ----------------------------------------------------------------------------
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients (id) on delete set null,
  client_name text not null,           -- snapshot del nombre al emitir
  number      text,                    -- N.º de factura (libre)
  amount      numeric(12,2) not null check (amount >= 0),
  currency    text not null default 'USD' check (currency in ('ARS','USD')),
  status      text not null default 'borrador'
              check (status in ('borrador','enviada','pagada','vencida','anulada')),
  issued_on   date,
  due_on      date,
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists invoices_status_idx    on public.invoices (status);
create index if not exists invoices_client_idx     on public.invoices (client_id);
create index if not exists invoices_issued_on_idx  on public.invoices (issued_on desc);

-- ----------------------------------------------------------------------------
-- roadmap_items: iniciativas por trimestre, opcionalmente enlazadas a un OKR
--   (objective_id). El estado va de idea a hecho. Es un tablero editable.
-- ----------------------------------------------------------------------------
create table if not exists public.roadmap_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  quarter      text not null check (quarter ~ '^\d{4}-Q[1-4]$'),  -- ej: '2026-Q3'
  status       text not null default 'planeado'
               check (status in ('idea','planeado','en_curso','hecho','pausado')),
  objective_id uuid references public.okr_objectives (id) on delete set null,
  owner        uuid references public.profiles (id) on delete set null,
  notes        text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists roadmap_items_quarter_idx   on public.roadmap_items (quarter desc, created_at);
create index if not exists roadmap_items_objective_idx on public.roadmap_items (objective_id);

-- ============================================================================
-- Row Level Security: ON, sin políticas abiertas => el acceso directo desde el
-- navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.clients        enable row level security;
alter table public.invoices       enable row level security;
alter table public.roadmap_items  enable row level security;
