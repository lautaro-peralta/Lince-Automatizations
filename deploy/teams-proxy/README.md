# Reverse-proxy de Lince Teams (`/teams`)

Monta **Lince Teams** (servicio Python del repo
[`lince-teams`](https://github.com/lautaro-peralta/lince-teams)) en el **mismo
origen** que el sitio, bajo `https://lince-automate.com.ar/teams`, para que
comparta el login del panel **sin doble inicio de sesión**.

> ⚠️ **Cuál usar.** Como el sitio corre como **Worker en un custom domain**, un
> Worker aparte en una *route* `/teams/*` **no intercepta** (el custom domain
> gana). Por eso el proxy vive **integrado en `web/src/hooks.server.ts`** — es el
> que funciona en este setup. Solo configurás la variable **`TEAMS_ORIGIN`** del
> Worker del sitio (en `web/wrangler.jsonc` o en el dashboard) y redesplegás el
> sitio. Este Worker aparte queda como alternativa para un sitio que **no** esté
> en un custom-domain Worker (p. ej. Cloudflare Pages puro).

## Por qué

La sesión de Supabase se guarda en el `localStorage` del navegador, que es
**por-origen**. Si Teams viviera en otro dominio (p. ej. `teams.…`), el usuario
tendría que loguearse de nuevo. Sirviéndolo en `/teams` del mismo dominio, Teams
lee la misma sesión que dejó el panel `/admin`.

El Worker (`worker.js`) reenvía `/teams/*` al servicio Python quitando el prefijo
`/teams`, incluido el `Upgrade` del WebSocket (`/teams/ws`) que da el tiempo real.

## Deploy

1. Desplegá el servicio Python de [`lince-teams`](https://github.com/lautaro-peralta/lince-teams)
   en **modo unificado** (con `SUPABASE_URL` + `SUPABASE_ANON_KEY` y `DATABASE_URL`
   apuntando al **mismo** Postgres de Supabase que Lince Automate) y anotá su URL:
   - **Oracle Cloud** (recomendado para Whisper; la VM no se duerme):
     guía en el repo, `deploy/DEPLOY-oracle.md`. El origen queda como
     `https://teams-origin.TU-DOMINIO.com` (registro DNS **en nube gris**).
   - **Render**: `https://lince-teams.onrender.com`.

2. En su `server/static/config.js`, poné la base bajo el prefijo del proxy:

   ```js
   window.LINCE_API_BASE = "/teams";
   ```

   Así el frontend llama a `/teams/api/...` y `/teams/ws`, que este Worker enruta
   al servicio. (El backend ya sabe que la sesión llega como JWT de Supabase.)

3. Editá `wrangler.jsonc`: `TEAMS_ORIGIN` = la URL de Render del paso 1, y el
   `pattern`/`zone_name` con tu dominio.

4. Desde esta carpeta:

   ```sh
   npm i -g wrangler   # si no lo tenés
   wrangler deploy
   ```

   La ruta `/teams/*` es más específica que el custom domain del sitio, así que
   Cloudflare la resuelve con este Worker y el resto del dominio sigue en el
   Worker de SvelteKit.

## Verificar

- `https://lince-automate.com.ar/teams/api/config` → `{"supabase": true, …}`.
- Entrá al panel `/admin`, luego abrí `/teams`: debería entrar **sin** pedir
  login. Sin sesión, Teams redirige a `/admin?next=/teams` y vuelve al entrar.

## Alternativa por subdominio

Si preferís `teams.lince-automate.com.ar` (Render custom domain, sin este
Worker): funciona con las mismas cuentas, pero al ser **otro origen** el usuario
inicia sesión una segunda vez en Teams. En ese caso poné
`LINCE_LOGIN_URL=https://lince-automate.com.ar/admin` en el servicio y dejá
`LINCE_API_BASE=""`.
