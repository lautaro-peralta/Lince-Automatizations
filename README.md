# Lince — Automatización para negocios

Página de presentación de Lince + un CRM liviano para captar y gestionar
clientes. Pensado para desplegarse en planes **gratuitos**: Vercel (frontend),
Render (backend) y Supabase (base de datos + auth + cron).

## Estructura del repo

```
.
├── web/                 # Frontend (Vite vanilla) → Vercel
│   ├── index.html       #   landing (HTML original, preservado)
│   └── admin/           #   panel interno
├── api/                 # Backend (Node + Express) → Render
├── supabase/            # Esquema SQL (con RLS) + Edge Function del cron
├── docs/                # Planeamiento (leer acá primero 👇)
├── render.yaml          # Blueprint de deploy del backend
└── lince-portfolio.html # HTML original de referencia (no se borró)
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Visión general, diagrama, decisiones, fiabilidad y seguridad |
| [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) | Tablas, relaciones, estados y RLS |
| [`docs/API.md`](docs/API.md) | Contrato de endpoints |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fases del CRM |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Paso a paso Supabase + Render + Vercel |
| [`docs/COSTOS.md`](docs/COSTOS.md) | Evaluación de costos (planes gratis vs producción) |
| [`docs/HOSTING-FRONTEND.md`](docs/HOSTING-FRONTEND.md) | Comparación de hosting de frontend (caso comercial gratis) |

## Arrancar en local (resumen)

```bash
# Backend
cd api && cp .env.example .env && npm install && npm run dev   # :3000

# Frontend (en otra terminal)
cd web && cp .env.example .env && npm install && npm run dev   # :5173
```

Detalle en `web/README.md`, `api/README.md` y `supabase/README.md`.

## Estado

**Desplegado y en producción** (Supabase + Render + frontend; el frontend migra
de Vercel a Cloudflare Pages). Todas las fases del CRM funcionan: leads, panel
admin (resumen + leads + presupuestos + reseñas), notificaciones, chatbot/reseñas
servidos desde la base, seguimiento de presupuestos. Lo que queda son las
integraciones de pago (WhatsApp/email/IA con credenciales) y el switch del
chatbot. Detalle por fase en [`docs/ROADMAP.md`](docs/ROADMAP.md).

> El HTML original (`lince-portfolio.html`) se conserva intacto como referencia.
> La versión activa de la landing vive en `web/` (migrada 1:1, con el agregado
> del formulario de contacto).
