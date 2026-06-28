# Hosting del frontend — comparación para el caso gratis

> Objetivo: elegir a dónde migrar la landing + panel (`web/`, app **SvelteKit**:
> landing prerenderizada + panel SPA) para usarla **comercialmente sin pagar**.
> Precios/limites ≈ junio 2026.
>
> Nota: el proyecto viene con `@sveltejs/adapter-vercel`. Como la landing se
> prerenderiza y el panel es client-only (`ssr=false`), la app es **estática**:
> para Cloudflare/Render/Netlify cambiá a `@sveltejs/adapter-static` (con
> `fallback: 'index.html'` para el panel); la salida pasa a ser `build/`.

## Por qué migrar de Vercel
El plan **Hobby de Vercel prohíbe el uso comercial** en sus términos. Para un
producto que se le da a clientes hay que pasar a **Vercel Pro (US$ 20/dev/mes)**…
o mover el frontend a un host cuyo **plan gratuito sí permita uso comercial**.
La buena noticia: hay varios, y el sitio es estático (migración trivial).

## Comparación

| Servicio | Comercial gratis | Ancho de banda (free) | Builds | Dominio + SSL gratis | Variables `PUBLIC_*` | Notas |
|---|---|---|---|---|---|---|
| **Cloudflare Pages** | ✅ **Sí** | **Ilimitado** | 500/mes | ✅ (5/proyecto) | ✅ | El más generoso. **Recomendado.** |
| **Render Static Sites** | ✅ Sí | 100 GB/mes | auto en push | ✅ (2 gratis, +$0.25 c/u) | ✅ | Consolidás con tu API que ya está en Render. |
| **Netlify** | ✅ Sí | 100 GB/mes | sistema de 300 créditos | ✅ | ✅ | Si te quedás sin créditos, el sitio queda **offline** hasta el mes siguiente. |
| **GitHub Pages** | ❌ **No** (sitios comerciales/SaaS no permitidos) | 100 GB soft | Actions | ✅ | solo en build | Descartado por sus términos. |
| **Vercel (actual)** | ❌ Hobby no comercial | — | sí | ✅ | ✅ | Comercial = Pro US$ 20/mes. Hay que migrar. |

> Los sitios **estáticos no se "duermen"** en ninguno (se sirven por CDN); el
> cold-start solo aplica al backend (Render web service). Acá no es un factor.

## Recomendación

1. **Cloudflare Pages (1ª opción).** Ancho de banda ilimitado, uso comercial
   permitido, 500 builds/mes (de sobra), dominio propio + SSL gratis, variables de
   entorno. Es el estándar de facto para estáticos comerciales gratis.
2. **Render Static Sites (2ª opción).** Si preferís **un solo proveedor**: tu API ya
   vive en Render, así que tenés todo en un panel. No se duerme (es CDN). El límite
   es 100 GB/mes de ancho de banda (más que suficiente para una landing) y 2
   dominios propios gratis.

Las dos son excelentes y gratis para uso comercial. Cloudflare gana por headroom
de ancho de banda; Render gana por simplicidad operativa (todo en un lugar).

## Cómo migrar (mismo build, sin tocar código)

Con `adapter-static`, el build es `npm run build` en `web/` → carpeta `build/`
(antes era `dist/` con Vite vanilla).

### Opción A — Cloudflare Pages
1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → este repo.
2. Build settings:
   - **Production branch:** `main`
   - **Root directory:** `web`
   - **Build command:** `npm run build`
   - **Output directory:** `build` (con `adapter-static`)
3. **Environment variables** (Production):
   ```
   PUBLIC_API_URL=https://lince-automatizations-backend.onrender.com
   PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. Deploy → te da `https://<proyecto>.pages.dev`.

### Opción B — Render Static Site
1. Render → **New → Static Site** → este repo.
2. **Root Directory:** `web` · **Build Command:** `npm run build` · **Publish:** `build` (con `adapter-static`).
3. Mismas variables `PUBLIC_*` del paso anterior.

## ⚠️ El paso que todos olvidan: CORS
Al cambiar el dominio del frontend, hay que avisarle al backend. En **Render →
(servicio backend) → Environment**, poné:
```
FRONTEND_ORIGIN=https://<proyecto>.pages.dev
```
(o tu dominio propio). Si no, el formulario de contacto y el login del panel
fallan por CORS. Redeploy del backend después de cambiarlo.

## Migración sin downtime
Dejá Vercel andando hasta que el nuevo hosting esté verificado (form + login OK),
recién ahí apuntás el dominio y/o apagás Vercel. Riesgo cero.

## Checklist post-migración
- [ ] `/` carga la landing
- [ ] `/admin/` carga el panel
- [ ] `FRONTEND_ORIGIN` (Render) apunta al nuevo dominio
- [ ] Enviar un lead de prueba → aparece en el panel
- [ ] Login del admin funciona
