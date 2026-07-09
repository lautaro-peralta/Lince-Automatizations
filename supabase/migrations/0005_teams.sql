-- ============================================================================
-- Lince · Teams — espacio de trabajo del equipo (tablero kanban + pizarra)
-- ----------------------------------------------------------------------------
-- Cómo aplicarla:
--   A) Supabase Studio → SQL Editor → pegar y "Run".
--   B) Supabase CLI:    supabase db push
--
-- Modelo de acceso (igual que 0001/0002/0003): RLS ON en todo, SIN políticas
-- abiertas. El navegador NO toca la base directo; todo pasa validado por la
-- API (Express con service-role). Los MIEMBROS del equipo son los mismos
-- `profiles` con rol 'admin' o 'socio' que ya usan el panel y el Startup OS:
-- no hay un padrón aparte.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- team_tasks: tablero kanban del equipo.
--   `status` mueve la tarjeta entre columnas (todo/doing/done); `priority`
--   ordena y colorea. `assignee_id`/`creator_id` apuntan a `profiles`.
--   `updated_at` la fija la API en cada cambio (sirve para el gráfico de
--   completadas por día y para el "casi en vivo" por sondeo del frontend).
-- ----------------------------------------------------------------------------
create table if not exists public.team_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  status      text not null default 'todo'   check (status in ('todo','doing','done')),
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  assignee_id uuid references public.profiles (id) on delete set null,
  creator_id  uuid references public.profiles (id) on delete set null,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists team_tasks_status_idx   on public.team_tasks (status);
create index if not exists team_tasks_assignee_idx on public.team_tasks (assignee_id);
create index if not exists team_tasks_updated_idx  on public.team_tasks (updated_at desc);

-- ----------------------------------------------------------------------------
-- team_board_items: pizarra colaborativa. Cada fila es un elemento del lienzo:
--   · note   -> nota adhesiva (content = texto, color = fondo)
--   · stroke -> trazo a mano alzada (content = JSON de puntos [[x,y],...],
--               color = tinta)
--   · image  -> imagen embebida como data URL en `content` (sin bucket: se
--               guarda inline para que sobreviva a los redeploys sin firmar
--               URLs). El tamaño lo acota la API.
--   x/y/w/h/z son la geometría en el lienzo. `updated_at` habilita el sondeo
--   incremental (?since=) que mantiene la pizarra sincronizada entre socios.
-- ----------------------------------------------------------------------------
create table if not exists public.team_board_items (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('note','stroke','image')),
  x          numeric(10,2) not null default 0,
  y          numeric(10,2) not null default 0,
  w          numeric(10,2),
  h          numeric(10,2),
  z          integer not null default 0,
  color      text,
  content    text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_board_items_z_idx      on public.team_board_items (z, id);
create index if not exists team_board_items_updated_idx on public.team_board_items (updated_at desc);

-- ----------------------------------------------------------------------------
-- team_activity: bitácora del equipo (quién creó/asignó/completó qué). El panel
--   muestra los últimos eventos. `actor` puede quedar en null si se borra el
--   perfil, pero el texto ya trae el nombre resuelto al momento del hecho.
-- ----------------------------------------------------------------------------
create table if not exists public.team_activity (
  id         uuid primary key default gen_random_uuid(),
  actor      uuid references public.profiles (id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists team_activity_created_idx on public.team_activity (created_at desc);

-- ============================================================================
-- Row Level Security: ON, sin políticas abiertas => el acceso directo desde el
-- navegador queda denegado; la API (service-role) pasa igual.
-- ============================================================================
alter table public.team_tasks       enable row level security;
alter table public.team_board_items enable row level security;
alter table public.team_activity    enable row level security;
