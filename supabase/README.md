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

## 5. Startup OS — el ERP interno (finanzas, clientes, marketing y estrategia)

El Startup OS (`web/static/startup-os/`) usa **el mismo Supabase Auth** que el panel
admin, con datos y reglas anti-fraude en el servidor.

1. **Aplicar el esquema nuevo:** en el SQL Editor, correr **en orden** las
   migraciones del Startup OS (cada una es idempotente, RLS ON y sin políticas
   abiertas):
   - `migrations/0002_startup_os.sql` → `expenses`, `expense_events` (append-only), `ad_metrics`.
   - `migrations/0003_startup_os_v1.sql` → `subscriptions`, `okr_objectives`, `okr_key_results`.
   - `migrations/0004_startup_os_clientes.sql` → `clients` (CRM + salud), `invoices` (facturación), `roadmap_items`.

2. **Cerrar los registros públicos** (clave para que _solo_ entre tu equipo):
   **Authentication → Providers → Email** → desactivar **"Enable Sign Ups"** y
   dejar **"Confirm email"** activado. Desde ahí, las cuentas solo las creás vos
   (Add user / Invite), y el usuario confirma su email al entrar la primera vez.

3. **Un solo padrón de cuentas.** Son **las mismas cuentas del panel**: cualquiera
   con rol `admin` (tu equipo de la landing) **ya tiene acceso al Startup OS**. Si
   querés un integrante que _solo_ entre al Startup OS y no al panel, usá el rol
   `socio`. Para crear una cuenta: **Authentication → Users → Add user** (o Invite),
   con el nombre real en **User Metadata** como `full_name`, ej.
   `{"full_name": "Ian Kasperczak"}`. Rol, en el SQL Editor:

   ```sql
   -- Equipo (panel + Startup OS):
   update public.profiles set role = 'admin'
   where id in (select id from auth.users where email in ('vos@...','ian@...','agustin@...'));

   -- (Opcional) alguien SOLO para Startup OS:
   -- update public.profiles set role = 'socio' where id = '<uuid>';
   ```

   > El nombre que ve cada uno sale de `full_name`; **no** se deduce del email.

4. **Login unificado.** El Startup OS **no tiene login propio**: usa la misma
   sesión que el panel. Si entrás a `/startup-os/` sin sesión, te manda a
   `/admin` a iniciar sesión y vuelve solo. El panel tiene un botón **"Startup
   OS ↗"** y el Startup OS uno **"Ir al panel de admin"**. Por eso, en
   **Authentication → URL Configuration → Redirect URLs** alcanza con
   `https://TU-SITIO/admin` (más el equivalente local si probás en dev). Ahí se
   maneja también el enlace de recuperación de contraseña.

5. **Configuración del frontend (automática).** No hay que hardcodear nada en el
   estático: el Startup OS toma la URL/anon key/API en runtime del endpoint
   `/auth-config` (que las lee de las mismas `PUBLIC_SUPABASE_URL` /
   `PUBLIC_SUPABASE_ANON_KEY` / `PUBLIC_API_URL` del panel). Solo asegurate de que
   esas variables estén cargadas en Cloudflare Pages.

6. **CORS:** agregá el origen del sitio (ej. `https://lince-automate.com`) a
   `FRONTEND_ORIGIN` del backend (donde lo hostees: Render, Oracle Cloud, etc.),
   para que la API acepte las llamadas del Startup OS.

**Reglas que aplica el backend** (no el navegador): quien registra un gasto no puede
aprobarlo (segregación de funciones); ≥ 1.000 (en la moneda del gasto) exige 2
socios distintos; la bitácora (`expense_events`) es append-only. Ver
`api/src/routes/expenses.js`.

**Módulos del Startup OS y sus rutas** (todas con `requireSocio`):

| Módulo                | Ruta API             | Tablas                              |
| --------------------- | -------------------- | ----------------------------------- |
| Dashboard (agregado)  | `/api/dashboard`     | lee todas las de abajo              |
| Gastos y aprobaciones | `/api/expenses`      | `expenses`, `expense_events`        |
| Comprobantes          | `/api/uploads`       | Supabase Storage (bucket privado)   |
| Facturación           | `/api/invoices`      | `invoices`                          |
| Suscripciones SaaS    | `/api/subscriptions` | `subscriptions`                     |
| Cartera / CRM + churn | `/api/clients`       | `clients`                           |
| Rendimiento anuncios  | `/api/ads`           | `ad_metrics`                        |
| OKRs y metas          | `/api/okrs`          | `okr_objectives`, `okr_key_results` |
| Roadmap               | `/api/roadmap`       | `roadmap_items`                     |

Los **clientes** del CRM (`clients`) son la cartera activa de la agencia, distinta
de `leads` (prospectos entrantes de la landing): un lead ganado se "gradúa" a
cliente. El MRR de los clientes `activo` es el MRR real del dashboard, y su `health`
alimenta el riesgo de churn.

## 6. Tabla `prospectos` (deprecada)

El formulario de contacto (`POST /api/prospects`) guardaba en una tabla
`prospectos` creada a mano, que **nadie leía**: el panel admin y `/api/stats`
usan `leads`. Desde ahora el endpoint escribe directo en `leads` (con
`source = 'landing'`), así los contactos aparecen en el panel.

Si tu `prospectos` tiene filas que querés conservar, migralas y borrá la tabla
desde el **SQL Editor** (ajustá los nombres de columna si tu tabla difiere):

```sql
insert into public.leads (name, business, contact, message, source, created_at)
select
  nombre,
  empresa,
  concat_ws(' · ', nullif(email, ''), nullif(telefono, '')),
  coalesce(mensaje, ''),
  'landing',
  created_at
from public.prospectos;

drop table public.prospectos;
```

Si está vacía, alcanza con el `drop table`.

### Comprobantes (subida de imágenes / PDF)

La subida pasa por `POST /api/uploads`. El proveedor se elige con
`UPLOADS_PROVIDER` (ver `api/.env.example`):

- **Supabase Storage (activo).** Es **gratis** en el tier free (1 GB) — no hace
  falta pagar. Pasos: Storage → **New bucket** llamado `receipts`, dejalo
  **privado** (recomendado para comprobantes financieros). Dejá
  `UPLOADS_PROVIDER=supabase` y `SUPABASE_RECEIPTS_BUCKET=receipts` en el backend.

  Como el bucket es privado, en `expenses.receipt_url` **no se guarda una URL
  pública**: se guarda una referencia estable (`sb-storage:...`). Cada vez que
  se lee un gasto (`GET /api/expenses`, o tras registrar/aprobar/rechazar), el
  backend la convierte en un **link firmado** válido por 6 horas — se regenera
  en cada lectura, así que nunca queda vencido para quien lo mira. Un link
  externo pegado a mano (Drive, un N.° de factura) no se toca, se muestra tal
  cual. Ver `api/src/lib/uploads.js` (`getSignedReceiptUrl`).
- **UploadThing (no implementado).** Queda solo como referencia comentada en
  `api/src/lib/uploads.js` para el día que se quiera retomar; el paquete
  `uploadthing` no está instalado y `UPLOADS_PROVIDER=uploadthing` responde 501.
