# Roadmap por fases — Lince

El CRM completo se construye **por fases**: primero lo que da valor y es
fiable, después lo más complejo. Cada fase deja algo desplegable.

## ✅ Fase 0 — Estructura y base (este planeamiento)
- Monorepo `web/` + `api/` + `supabase/` + `docs/`.
- Landing original migrada a Vite **sin perder nada** (con formulario nuevo).
- Backend Express con `/health` y la rebanada de **leads de punta a punta**.
- Esquema de base completo (con RLS) y guías de deploy.

## 🔜 Fase 1 — Leads en producción
- Deploy: Supabase (esquema) + Render (API) + Vercel (web).
- Probar el formulario real guardando en la base.
- Pinger de keep-alive sobre `/health`.

## 🔜 Fase 2 — Panel admin
- Login con Supabase Auth + rol admin (ya scaffoldeado en `/admin/`).
- Listado de leads (ya scaffoldeado) + cambio de estado y notas.
- Filtros/búsqueda básicos.

## 🔜 Fase 3 — Demos conectadas a backend real
- Servir el árbol del chatbot desde `chatbot_flows` (hoy está hardcodeado).
- Persistir sesiones y mensajes (`chatbot_sessions`, `chatbot_messages`).
- Monitor de reseñas alimentado por la tabla `reviews`.

## 🔜 Fase 4 — Presupuestos con seguimiento
- ABM de `budgets` desde el panel.
- Edge Function `budget-followups` + `pg_cron` enviando recordatorios.
- Integración de envío (WhatsApp Cloud API / email).

## 🔮 Fase 5 — Mejoras
- Notificación al equipo cuando llega un lead (email/WhatsApp).
- Métricas en el panel. IA para sugerir respuestas a reseñas.

## Estado actual de endpoints

| Endpoint            | Estado        |
|---------------------|---------------|
| `GET /health`       | ✅ funcional   |
| `POST /api/leads`   | ✅ funcional   |
| `GET /api/leads`    | ✅ funcional   |
| `/api/chatbot/*`    | 🔜 stub (F3)  |
| `/api/budgets/*`    | 🔜 stub (F4)  |
