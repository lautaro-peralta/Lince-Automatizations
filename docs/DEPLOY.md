# Guía de deploy — Lince

Orden recomendado: **Supabase → Render → Vercel** (cada uno necesita datos del
anterior). Todo en planes gratuitos.

---

## 1. Supabase (base de datos + auth)

1. Crear proyecto en [app.supabase.com](https://app.supabase.com).
2. **SQL Editor** → pegar `supabase/migrations/0001_init.sql` → **Run**.
3. Crear el usuario admin y promoverlo (ver `supabase/README.md`).
4. Anotar de **Project Settings → API**:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secreta)

---

## 2. Render (backend Express)

1. New → **Web Service** → conectar este repo.
2. Configurar:
   - **Root Directory:** `api`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. **Environment** (variables):
   ```
   SUPABASE_URL=...               (Project URL)
   SUPABASE_SERVICE_ROLE_KEY=...  (service_role, SECRETA)
   FRONTEND_ORIGIN=https://tu-app.vercel.app
   NODE_ENV=production
   # Opcionales: avisos de leads nuevos (si faltan, solo se loguean)
   NOTIFY_WEBHOOK_URL=...          (Make/Zapier/Discord/Slack/WhatsApp-bridge)
   RESEND_API_KEY=...             (email vía Resend)
   NOTIFY_EMAIL_TO=...
   # Opcional: IA para sugerir respuestas a reseñas (si falta, usa plantilla)
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=claude-opus-4-8
   ```
   > `PORT` lo setea Render solo.
4. Deploy. Verificar: `https://tu-api.onrender.com/health` → `{ ok: true }`.
5. (Recomendado) Crear un *cron* en [cron-job.org](https://cron-job.org) que
   pegue a `/health` cada ~10 min para evitar el cold start.

> Alternativa IaC: el repo trae `render.yaml` para crear el servicio como
> Blueprint (Render → New → Blueprint).

---

## 3. Vercel (frontend)

1. New Project → importar este repo.
2. Configurar:
   - **Root Directory:** `web`
   - **Framework Preset:** Vite (o "Other")
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   ```
   VITE_API_URL=https://tu-api.onrender.com
   VITE_SUPABASE_URL=...        (Project URL)
   VITE_SUPABASE_ANON_KEY=...   (anon public)
   ```
4. Deploy. La landing queda en `/` y el panel en `/admin/`.

---

## 4. Cerrar el círculo

- Volvé a Render y poné en `FRONTEND_ORIGIN` la URL final de Vercel (CORS).
- Probá el formulario de la landing → debería aparecer en `/admin/`.

## Checklist

- [ ] Esquema aplicado en Supabase
- [ ] Usuario admin creado y promovido
- [ ] API en Render responde `/health`
- [ ] Variables `VITE_*` cargadas en Vercel
- [ ] `FRONTEND_ORIGIN` apunta a Vercel
- [ ] Lead de prueba viaja landing → API → base → panel
- [ ] Pinger de keep-alive configurado
