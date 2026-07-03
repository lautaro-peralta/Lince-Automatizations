# Lince — Automatización para negocios

Página de presentación de Lince + un CRM liviano para captar y gestionar
clientes. Pensado para desplegarse en planes **gratuitos**: Cloudflare Pages
(frontend), Render (backend) y Supabase (base de datos + auth + cron).

## Estructura del repo

```
.
├── web/                 # Frontend (SvelteKit + Tailwind v4) → Cloudflare Pages
│   ├── src/routes/+page.svelte  # landing pública (prerenderizada)
│   └── src/routes/admin/        # panel interno (SPA con auth)
├── api/                 # Backend (Node + Express) → Render
├── supabase/            # Esquema SQL (con RLS) + Edge Function del cron
├── docs/                # Planeamiento (leer acá primero 👇)
└── render.yaml          # Blueprint de deploy del backend
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Visión general, diagrama, decisiones, fiabilidad y seguridad |
| [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) | Tablas, relaciones, estados y RLS |
| [`docs/API.md`](docs/API.md) | Contrato de endpoints |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Paso a paso Supabase + Render + Cloudflare Pages |
| [`docs/COSTOS.md`](docs/COSTOS.md) | Evaluación de costos (planes gratis vs producción) |

## Arrancar en local (resumen)

```bash
# Backend
cd api && cp .env.example .env && npm install && npm run dev   # :3000

# Frontend (en otra terminal)
cd web && cp .env.example .env && npm install && npm run dev   # :5173
```

Detalle en `web/README.md`, `api/README.md` y `supabase/README.md`.

## Estado

El **código de todas las fases del CRM está implementado y verificado** en
build/arranque (leads, panel admin con resumen + leads + presupuestos + reseñas,
notificaciones, chatbot/reseñas servidos desde la base, seguimiento de
presupuestos). Lo que falta es **desplegar** y cargar credenciales de
integraciones.

> El frontend está en **SvelteKit + Tailwind v4** con un diseño anclado en la
> marca (paleta tierra, lince, tipografías). La landing se prerenderiza para
> SEO/performance y el panel es una SPA detrás de login. Detalle en
> [`web/README.md`](web/README.md).
