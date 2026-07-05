# Supabase (`supabase/`)

Postgres + Auth + cron del CRM de Lince.

```
supabase/
├── migrations/
│   └── 0001_init.sql              # Esquema completo + RLS
├── seed.sql                       # Datos de ejemplo (opcional)
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

**Datos de ejemplo (opcional):** después del esquema, corré `seed.sql` igual
que arriba para tener un negocio, un flujo de chatbot, reseñas y presupuestos
de prueba (uno ya "vencido" para ver el seguimiento). Es idempotente.

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

- `Project URL` → `SUPABASE_URL` (backend) y `PUBLIC_SUPABASE_URL` (panel).
- `anon public` → `PUBLIC_SUPABASE_ANON_KEY` (panel; segura de exponer).
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (backend; **SECRETA**).

## 4. Programar el seguimiento de presupuestos (Fase 4)

Cuando se implemente, se despliega la Edge Function y se la agenda con
`pg_cron` + `pg_net` (ambas disponibles en Supabase):

```bash
supabase functions deploy budget-followups
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles dentro de la
función. Para que **envíe** recordatorios (y no solo loguee), cargá los mismos
secretos opcionales de notificación que usa el backend:

```bash
supabase secrets set NOTIFY_WEBHOOK_URL=... RESEND_API_KEY=... NOTIFY_EMAIL_FROM="Lince <...>"
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

## 5. Startup OS — gastos, aprobaciones y anuncios

El Startup OS (`web/static/startup-os/`) usa **el mismo Supabase Auth** que el panel
admin, con datos y reglas anti-fraude en el servidor.

1. **Aplicar el esquema nuevo:** SQL Editor → pegar `migrations/0002_startup_os.sql`
   → **Run** (agrega `expenses`, `expense_events` append-only y `ad_metrics`, todas
   con RLS).

2. **Cerrar los registros públicos** (clave para que _solo_ entren los socios):
   **Authentication → Providers → Email** → desactivar **"Enable Sign Ups"**. Desde
   ese momento, las cuentas solo las creás vos.

3. **Crear las cuentas de los socios:** **Authentication → Users → Add user** por cada
   uno (poné el nombre real en **User Metadata** como `full_name`, ej.
   `{"full_name": "Ian Kasperczak"}`). Después promovelos a `socio` en el SQL Editor:

   ```sql
   update public.profiles set role = 'socio'
   where id in (
     select id from auth.users
     where email in ('vos@...','ian@...','agustin@...')
   );
   ```

   > El nombre que ve cada uno sale de `full_name`; **no** se deduce del email.

4. **Configurar el frontend:** en `web/static/startup-os/index.html`, completá el
   bloque `CONFIGURACIÓN` (arriba del `<script type="module">`) con tu
   `SUPABASE_URL`, tu `anon key` (pública) y la `API_URL` del backend. Deben coincidir
   con las del panel admin.

5. **CORS:** agregá el origen del sitio (ej. `https://lince-automate.com`) a
   `FRONTEND_ORIGIN` en Render, para que la API acepte las llamadas del Startup OS.

**Reglas que aplica el backend** (no el navegador): quien registra un gasto no puede
aprobarlo (segregación de funciones); ≥ US$ 1.000 exige 2 socios distintos; la
bitácora (`expense_events`) es append-only. Ver `api/src/routes/expenses.js`.

### Comprobantes (subida de imágenes / PDF)

La subida pasa por `POST /api/uploads` y guarda solo la URL en `receipt_url`. El
proveedor se elige con `UPLOADS_PROVIDER` (ver `api/.env.example`):

- **UploadThing (activo).** Creá una app en [uploadthing.com](https://uploadthing.com),
  copiá el **token** a `UPLOADTHING_TOKEN` en Render. Listo. Tier gratuito generoso.
- **Supabase Storage (cuando quieras migrar).** Es **gratis** en el tier free (1 GB).
  Storage → **New bucket** llamado `receipts`; poné `UPLOADS_PROVIDER=supabase` y
  `SUPABASE_RECEIPTS_BUCKET=receipts`. El código ya está (`api/src/lib/uploads.js`);
  si el bucket es privado, cambiá `getPublicUrl` por una URL firmada.
