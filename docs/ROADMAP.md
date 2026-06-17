# Roadmap por fases — Lince

El CRM completo se construye **por fases**. Cada fase deja algo desplegable.
Estado al día de hoy: el código de las fases 2–4 está implementado y verificado
en build/arranque; falta **desplegar** y, en algunos casos, conectar
integraciones externas (envío de WhatsApp/email) y el switch final del cliente.

## ✅ Fase 0 — Estructura y base
- Monorepo `web/` + `api/` + `supabase/` + `docs/`.
- Landing original migrada a Vite **sin perder nada** (con formulario nuevo).
- Backend Express con `/health` y leads de punta a punta.
- Esquema de base completo (con RLS) + datos de ejemplo (`seed.sql`).

## ✅ Fase 1 — Leads (código listo)
- `POST/GET/PATCH /api/leads` con validación, honeypot, filtros y notas.
- **Pendiente:** desplegar y probar el formulario real en producción.

## ✅ Fase 2 — Panel admin (código listo)
- Login con Supabase Auth + rol admin.
- Panel con pestañas: **Leads** (buscar, filtrar, cambiar estado, notas),
  **Presupuestos** y **Reseñas**.
- **Pendiente:** desplegar.

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

> "Código listo" = implementado y verificado en build + arranque local. La
> ejecución contra datos reales requiere el deploy (ver `DEPLOY.md`).
