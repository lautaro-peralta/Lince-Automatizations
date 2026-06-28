# Arquitectura — Lince

Documento de planeamiento de la página de presentación de Lince y su CRM.

## Objetivo

Una landing page de presentación (la que ya existía) que, además de mostrar
los casos, **capture clientes reales** y se administre desde un panel interno,
todo desplegable en planes gratuitos y con foco en que **funcione fiablemente**.

## Stack elegido

| Capa            | Tecnología                 | Hosting (free)        |
|-----------------|----------------------------|-----------------------|
| Frontend        | SvelteKit + Tailwind v4 (TS)     | **Vercel**      |
| Backend / API   | Node.js + Express          | **Render**            |
| Base de datos   | Postgres                   | **Supabase**          |
| Auth (panel)    | Supabase Auth              | Supabase              |
| Tareas programadas | `pg_cron` + Edge Function | Supabase            |

Las decisiones (y sus alternativas descartadas) están al final.

## Diagrama

```
                 ┌──────────────────────────────────────────────┐
                 │                  VERCEL                        │
                 │  Frontend (Vite, estático)                     │
                 │   /         -> Landing (HTML original)         │
                 │   /admin/   -> Panel interno                   │
                 └───────┬───────────────────────┬───────────────┘
       POST /api/leads   │                       │  login (anon key)
       GET  /api/leads   │                       │
                         v                       v
            ┌──────────────────────┐   ┌────────────────────────────┐
            │       RENDER         │   │          SUPABASE          │
            │  Backend Express     │   │  Auth (JWT del panel)      │
            │  - valida            │   │  Postgres + RLS            │
            │  - lógica del CRM    │──▶│  pg_cron + Edge Functions  │
            │  (service-role key)  │   │  (seguimiento presupuestos)│
            └──────────────────────┘   └────────────────────────────┘
```

## Flujos principales

### 1. Captura de lead (Fase 1, ya funcional)
1. El visitante completa el formulario de la landing.
2. `contact.js` hace `POST /api/leads` al backend.
3. Express valida (zod) + filtra honeypot y guarda en `leads` (Supabase).
4. El backend avisa al equipo (webhook/email) sin bloquear la respuesta
   (fire-and-forget; si no hay credenciales, solo loguea).
5. El equipo ve los leads en `/admin/`.

### 2. Panel admin
1. El admin entra a `/admin/` y se loguea con **Supabase Auth** (anon key).
2. El panel guarda el JWT y llama `GET /api/leads` con `Authorization: Bearer`.
3. Express valida el JWT y el rol `admin` antes de devolver datos.

### 3. Seguimiento de presupuestos (Fase 4)
- `pg_cron` (en Supabase) dispara una **Edge Function** que detecta
  presupuestos sin respuesta y envía recordatorios. **No depende de Render.**

## Decisiones de fiabilidad

- **El cron NO vive en Render.** El plan free de Render duerme el servicio tras
  ~15 min de inactividad y no ofrece cron fiable. Las tareas programadas van a
  Supabase (`pg_cron`), que es independiente.
- **Cold start de Render:** el primer request tras la inactividad tarda
  ~30–50 s. Se mitiga con un *pinger* externo (cron-job.org / UptimeRobot)
  golpeando `GET /health` cada ~10 min. El frontend además muestra un mensaje
  claro si el server está despertando.
- **Validación doble:** el cliente valida por UX, pero el backend **revalida
  todo** (nunca confía en el navegador).
- **Pocas piezas, una API clara:** toda la lógica sensible pasa por Express;
  el frontend casi no toca Supabase directamente.

## Seguridad

- La **service-role key** (acceso total a la DB) vive solo en el backend.
- El frontend solo usa la **anon key** (pública por diseño, protegida por RLS)
  y únicamente en el panel para el login.
- **RLS activado** en todas las tablas, sin políticas abiertas: el acceso
  directo desde el navegador queda denegado; la API pasa por service-role.
- CORS restringido al origen del frontend en producción.
- Honeypot anti-spam en el formulario público.

## Alternativas consideradas (y por qué no)

- **Python + FastAPI:** excelente, sobre todo para IA futura; se descartó por
  ahora para mantener un solo lenguaje (JS) en todo el proyecto y simplificar.
- **Solo Supabase (sin backend):** menos piezas, pero reparte la lógica del
  CRM/chatbot entre Edge Functions y reglas RLS; más difícil de razonar.
- **Neon.tech en vez de Supabase:** Postgres más liviano, pero no trae Auth ni
  cron integrados, que acá nos sirven.
- **Frontend estático sin build:** menor riesgo, pero sin variables de entorno
  reales y con el panel admin más tedioso de mantener.
```
