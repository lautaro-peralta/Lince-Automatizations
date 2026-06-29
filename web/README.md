# Lince — Frontend

Frontend de Lince: **landing pública** + **panel admin/CRM**, construido con
**SvelteKit (Svelte 5) + TypeScript + Tailwind v4**. Se deploya en Vercel
(free-tier) y habla con el backend (Express en Render) y con Supabase (auth).

## Stack

- **SvelteKit 2 / Svelte 5 (runes)** sobre Vite — adapter `@sveltejs/adapter-vercel`.
- **Tailwind CSS v4** con tokens de marca en `@theme` (ver `src/app.css`).
- **Fuentes self-host** con Fontsource (Fraunces, Source Sans 3, JetBrains Mono).
- **Imágenes** optimizadas con `@sveltejs/enhanced-img` (AVIF/WebP responsive).
- **Iconos** tree-shakeable con `unplugin-icons` + Lucide (`~icons/lucide/*`).
- **Supabase** (`@supabase/supabase-js`) solo para el login del panel.
- **Bits UI** disponible para componentes accesibles del panel.

## Estructura

```
src/
├── app.css                 # Design system: tokens (@theme) + base + utilidades
├── app.html                # Shell HTML (marca html.js para las animaciones)
├── lib/
│   ├── api.ts              # Cliente HTTP del backend (apiFetch tipado)
│   ├── supabase.ts         # Cliente Supabase (browser, anon key)
│   ├── actions/reveal.ts   # Acción de aparición al hacer scroll
│   ├── utils/              # format (fechas/moneda/CSV), cx
│   ├── data/chatbot.ts     # Árbol de conversación del chatbot demo
│   ├── admin/              # auth (sesión reactiva) + tipos del dominio
│   └── components/
│       ├── Button.svelte, Badge.svelte
│       ├── landing/        # Chatbot, LiveMonitor, Receipt, ContactForm
│       └── admin/          # Skeleton, ErrorState, RowStatus, NotesInput
└── routes/
    ├── +layout.svelte      # CSS + fuentes globales
    ├── +page.svelte        # Landing (prerender=true)
    └── admin/              # Panel SPA (ssr=false, noindex)
        ├── +layout.svelte  # Guard de auth + login + chrome
        ├── +page.svelte    # Resumen
        ├── leads/, presupuestos/, resenas/
```

## Desarrollo

```sh
cp .env.example .env     # completá las claves (ver abajo)
npm install
npm run dev              # http://localhost:5173
```

Otros scripts: `npm run build`, `npm run preview`, `npm run check`
(svelte-check), `npm run lint`, `npm run format`, `npm run test`.

## Variables de entorno

Solo las `PUBLIC_*` se exponen al navegador (ver `.env.example`):

| Variable                   | Para qué                               |
| -------------------------- | -------------------------------------- |
| `PUBLIC_API_URL`           | URL del backend (Express en Render)    |
| `PUBLIC_SUPABASE_URL`      | Proyecto de Supabase (login del panel) |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública, protegida por RLS)  |

## Deploy (Vercel)

- **Root Directory:** `web`
- **Build Command:** `npm run build` · **Framework:** SvelteKit (autodetectado)
- Cargá las variables `PUBLIC_*` en el proyecto de Vercel.
- Cabeceras de seguridad y `noindex` del panel: `vercel.json`
  (y `static/_headers` para Cloudflare/Netlify).

## Notas

- La **landing** se prerenderiza a HTML estático (Core Web Vitals + SEO). Con el
  patrón `html.js`, el contenido es visible incluso sin JavaScript.
- El **panel** es una SPA detrás de login (auth en el cliente con Supabase). Las
  lecturas/escrituras sensibles pasan por el backend, que verifica el JWT y el
  rol admin.
