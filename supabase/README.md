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

4. **Recuperación de contraseña / links de invitación.** En **Authentication → URL
   Configuration**, agregá a **Redirect URLs** las dos páginas que reciben el enlace:
   `https://TU-SITIO/admin` y `https://TU-SITIO/startup-os/` (más sus equivalentes
   locales si probás en dev). Ambas pantallas detectan el enlace y muestran el
   formulario para elegir una contraseña nueva.

5. **Configurar el frontend:** en `web/static/startup-os/index.html`, completá el
   bloque `CONFIGURACIÓN` (arriba del `<script type="module">`) con tu
   `SUPABASE_URL`, tu `anon key` (pública) y la `API_URL` del backend. Deben coincidir
   con las del panel admin.

6. **CORS:** agregá el origen del sitio (ej. `https://lince-automate.com`) a
   `FRONTEND_ORIGIN` del backend (donde lo hostees: Render, Oracle Cloud, etc.),
   para que la API acepte las llamadas del Startup OS.

**Reglas que aplica el backend** (no el navegador): quien registra un gasto no puede
aprobarlo (segregación de funciones); ≥ US$ 1.000 exige 2 socios distintos; la
bitácora (`expense_events`) es append-only. Ver `api/src/routes/expenses.js`.

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
