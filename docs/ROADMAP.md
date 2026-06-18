# Roadmap por fases — Lince

El CRM completo se construye **por fases**. Cada fase deja algo desplegable.
**Estado: desplegado y en producción** (Supabase + Render + frontend; el frontend
migra de Vercel a Cloudflare Pages). Login y CORS resueltos. Lo que queda son
integraciones de pago (WhatsApp/email/IA con credenciales) y el switch del chatbot.

## ✅ Fase 0 — Estructura y base
- Monorepo `web/` + `api/` + `supabase/` + `docs/`.
- Landing original migrada a Vite **sin perder nada** (con formulario nuevo).
- Backend Express con `/health` y leads de punta a punta.
- Esquema de base completo (con RLS) + datos de ejemplo (`seed.sql`).

## ✅ Fase 1 — Leads (desplegado)
- `POST/GET/PATCH /api/leads` con validación, honeypot, filtros y notas.
- En producción; verificar el formulario real punta a punta.

## ✅ Fase 2 — Panel admin (desplegado)
- Login con Supabase Auth + rol admin (login y CORS ya resueltos).
- Panel con pestañas: **Leads** (buscar, filtrar, estado, notas, export CSV),
  **Presupuestos** y **Reseñas**.

## ✅ Fase 3 — Demos / datos reales
- `GET /api/chatbot/flows/:slug`, `POST /sessions` (acepta `flow_slug`),
  `POST /sessions/:id/messages`. `GET/PATCH /api/reviews`. Datos en `seed.sql`.
- ✅ **Registro de conversaciones del chatbot** desde la landing, desacoplado
  (no toca la demo) y activable con `VITE_CHATBOT_LOGGING=true`.
- 🔜 **Opcional:** que el chatbot *renderice* desde el flujo de la base (hoy usa
  el árbol embebido, más completo; el de la base es la versión de datos).

## ✅ Fase 4 — Presupuestos + seguimiento (código listo)
- `GET/POST/PATCH /api/budgets` + sección en el panel.
- Edge Function `budget-followups` (detecta vencidos, registra y actualiza).
- **Pendiente:** desplegar la función + agendar `pg_cron`, y conectar el envío
  real (WhatsApp Cloud API / email) en el punto de integración marcado.

## 🔄 Fase 5 — Mejoras (en progreso)
- ✅ **Aviso al equipo cuando llega un lead** (capa de notificaciones por
  webhook / email Resend; sin credenciales, loguea). Mismo mecanismo en la
  Edge Function de presupuestos. **Pendiente:** cargar credenciales en el deploy.
- ✅ **Métricas en el panel** (pestaña "Resumen" → `GET /api/stats`).
- ✅ **Export CSV de leads** desde el panel (genera el archivo en el navegador).
- ✅ **IA para sugerir respuestas a reseñas** (`POST /api/reviews/:id/suggest`
  con Claude; sin API key cae a plantilla). **Pendiente:** cargar la API key.

## Estado de endpoints

| Endpoint                               | Estado      |
|----------------------------------------|-------------|
| `GET /health`                          | ✅          |
| `POST/GET/PATCH /api/leads`            | ✅          |
| `GET/POST/PATCH /api/budgets`          | ✅          |
| `GET/PATCH /api/reviews`               | ✅          |
| `POST /api/reviews/:id/suggest` (IA)   | ✅          |
| `GET /api/stats`                       | ✅          |
| `GET /api/chatbot/flows/:slug`         | ✅          |
| `POST /api/chatbot/sessions[/:id/...]` | ✅          |

> Todos los endpoints están **desplegados**. Lo pendiente es de configuración
> (credenciales de WhatsApp/email/IA, `pg_cron`) y el switch del chatbot — ver
> las notas "Pendiente" de cada fase y `DEPLOY.md`.
