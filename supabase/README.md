# Supabase (`supabase/`)

Postgres + Auth + cron del CRM de Lince.

```
supabase/
├── migrations/
│   └── 0001_init.sql              # Esquema completo + RLS
└── functions/
    └── budget-followups/index.ts  # Edge Function del seguimiento (Fase 4)
```

## 1. Aplicar el esquema

**Opción A — Studio (la más simple):** abrí tu proyecto en
[app.supabase.com](https://app.supabase.com) → **SQL Editor** → pegá el
contenido de `migrations/0001_init.sql` → **Run**.

**Opción B — CLI:**

```bash
supabase link --project-ref TU_REF
supabase db push
```

## 2. Crear el primer usuario admin

1. **Authentication → Users → Add user** (email + contraseña).
2. El trigger crea su fila en `profiles` con rol `viewer`. Promovelo a admin
   desde el **SQL Editor**:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'vos@tuemail.com');
   ```

## 3. Claves que vas a necesitar

En **Project Settings → API**:

- `Project URL` → `SUPABASE_URL` (backend) y `VITE_SUPABASE_URL` (panel).
- `anon public` → `VITE_SUPABASE_ANON_KEY` (panel; segura de exponer).
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (backend; **SECRETA**).

## 4. Programar el seguimiento de presupuestos (Fase 4)

Cuando se implemente, se despliega la Edge Function y se la agenda con
`pg_cron` + `pg_net` (ambas disponibles en Supabase):

```bash
supabase functions deploy budget-followups
```

```sql
-- Habilitar extensiones (una sola vez)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Correr todos los días a las 10:00 y llamar a la Edge Function
select cron.schedule(
  'budget-followups-daily',
  '0 10 * * *',
  $$
  select net.http_post(
    url     := 'https://TU-PROYECTO.functions.supabase.co/budget-followups',
    headers := jsonb_build_object('Authorization', 'Bearer TU_SERVICE_ROLE_KEY')
  );
  $$
);
```

> El cron vive en Supabase (no en Render), así el seguimiento funciona aunque
> el backend esté dormido.
