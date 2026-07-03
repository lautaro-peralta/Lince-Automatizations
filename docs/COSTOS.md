# Evaluación de costos — Lince

> Precios aproximados a **junio 2026**, en **USD**. Cambian seguido: verificá los
> links de Fuentes antes de comprometer presupuesto. Pensado desde la óptica de
> **Lince** (cuánto cuesta operar el servicio), no del cliente final.

## TL;DR — tres escenarios

| Escenario | Costo fijo / mes | Para qué sirve |
|---|---|---|
| **A. Piloto 100% gratis** | **US$ 0** | El primer caso gratis. Todo en planes free. Con salvedades (abajo). |
| **B. Producción confiable** *(recomendado al cobrar)* | **≈ US$ 33** | Sin "cold start", con backups, apto para clientes que pagan. |
| **C. B pero quedándote en Vercel** | **≈ US$ 53** | Igual que B, pero Vercel cobra $20 por uso comercial. |

**Lo más importante:** ese costo fijo es **compartido entre todos los clientes**.
El modelo de datos ya es **multi-negocio** (tabla `businesses`), así que un solo
Supabase + un solo backend + un solo frontend sirven a **muchos** negocios. El
costo *marginal* de sumar un cliente más es casi cero (ver "Costos variables").

---

## Costos fijos (la plataforma)

### Frontend (la landing + el panel)
- **Cloudflare Pages / Netlify — gratis, y permiten uso comercial.** 500 builds/mes
  (Cloudflare). **Recomendado: US$ 0.**
- **Vercel:** su plan **Hobby prohíbe uso comercial**; para un negocio hay que ir a
  **Pro: US$ 20/dev/mes** (incluye US$ 20 de crédito). Por eso el frontend ya se
  migró de Vercel a Cloudflare Pages.

### Backend / API (Express)
- **Render Free — US$ 0:** 512 MB RAM, 750 horas/mes. **Se duerme tras 15 min** sin
  tráfico → el primer request luego de un rato tarda **30–60 s** (cold start). Sirve
  para pilotos; se mitiga con un *pinger* a `/health`.
- **Render Starter — US$ 7/mes** por servicio: sin sleep, siempre despierto.
  El workspace "Hobby" es gratis (no hace falta pagar asiento para una persona).

### Base de datos + Auth + Cron (Supabase)
- **Supabase Free — US$ 0:** 500 MB de base, 50.000 usuarios/mes, cron y Edge
  Functions incluidos. **Pero:** sin backups, máx. 2 proyectos, y **se pausa tras 1
  semana de inactividad** (un sitio con tráfico no se pausa, pero igual no hay
  backups → riesgo para datos de un cliente que paga).
- **Supabase Pro — US$ 25/mes:** 8 GB, 100.000 usuarios/mes, **sin pausa**, backups
  y tope de gasto activado por defecto. **Recomendado al cobrar.**

### Dominio (opcional)
- ≈ **US$ 10–15/año (≈ US$ 1/mes).** Los subdominios `.pages.dev` / `.onrender.com`
  / `.supabase.co` son gratis; el dominio propio es solo imagen.

---

## Costos variables (por uso) — casi todo lo "pago" que dejamos para después

### WhatsApp (Cloud API de Meta, directo)
El modelo cambió en julio 2025 a **cobro por mensaje**, y la clave para Lince es:
- **Responder a un cliente que escribió primero = GRATIS** dentro de la ventana de
  24 h (hasta 72 h si entró por un anuncio "click to WhatsApp"). Texto libre y
  plantillas *utility* dentro de la ventana **no se cobran**.
- O sea: el **chatbot reactivo** ("responde solo cuando el cliente escribe") cuesta
  **US$ 0** en mensajería.
- Lo que sí se cobra: mensajes **iniciados por el negocio** fuera de ventana
  (ej. un recordatorio de presupuesto) → plantilla *utility*, típicamente
  **< US$ 0,01** c/u; las de *marketing* valen más y varían por país.
- Argentina ya se factura en **ARS** (desde abril 2026).
- **Tip:** usar la **Cloud API de Meta directo no tiene fee de plataforma**. Un BSP
  (Twilio, 360dialog) simplifica la integración pero **agrega un markup** por
  mensaje — evaluá si lo necesitás.

### Email (Resend) — para avisos de leads
- **Free: 3.000 emails/mes** (100/día). Para notificar leads de un puñado de
  negocios, **sobra y es US$ 0.**
- Pro **US$ 20/mes** (50.000) solo si algún día mandás volúmenes altos.

### IA para respuestas a reseñas (Anthropic) — *fase posterior, pago por uso*
- Tarifas: **Claude Haiku 4.5** US$ 1 / US$ 5 por millón de tokens (entrada/salida);
  **Claude Opus 4.8** US$ 5 / US$ 25.
- Una respuesta a una reseña es chica (~500 tokens entrada + ~150 salida):
  - con **Haiku ≈ US$ 0,001** c/u → **1.000 respuestas ≈ US$ 1/mes**.
  - con **Opus 4.8 ≈ US$ 0,006** c/u → **1.000 respuestas ≈ US$ 6/mes**.
- Es **opcional** (sin API key, el sistema ya cae a una plantilla gratis). Cuando lo
  actives, para este caso de uso **Haiku alcanza y es 5–6× más barato**.

---

## Servicios sin costo directo, pero con requisitos

### Reseñas de Google (Google Business Profile API)
- **La API es gratis** (sin cobro por llamada): leer reseñas y **responderlas** por
  API no cuesta.
- **Pero** requiere: solicitar acceso en Google Cloud, una ficha de Google verificada
  con **+60 días de antigüedad** y un sitio web válido. El cuello de botella es la
  **aprobación**, no el dinero.

---

## Estimación por escenario (detalle)

**A. Piloto gratis — US$ 0/mes**
Cloudflare Pages (front) + Render Free (API, con cold start) + Supabase Free
(sin backups) + Resend Free + WhatsApp reactivo + IA por plantilla (sin key).
→ Ideal para **el primer caso gratis**. Salvedades: cold start de la API y
sin backups (aceptable para un piloto, no para producción seria).

**B. Producción confiable — ≈ US$ 33/mes (base, compartida)**
Cloudflare Pages US$ 0 + Render Starter US$ 7 + Supabase Pro US$ 25 + dominio ≈ US$ 1.
\+ variables por uso (abajo).

**C. Igual que B en Vercel — ≈ US$ 53/mes**
Sumá US$ 20 de Vercel Pro. No aporta nada que Cloudflare/Netlify no den gratis para
este proyecto.

**Variable por cliente (B o C):** normalmente **US$ 0–5/mes**:
WhatsApp reactivo gratis · recordatorios proactivos en centavos · IA en centavos.

---

## Recomendación

1. **Primer caso gratis → Escenario A (US$ 0).** Migrá el frontend a **Cloudflare
   Pages** (Vercel Hobby no permite uso comercial) y listo: opera sin costo.
2. **Cuando empieces a cobrar → Escenario B (≈ US$ 33/mes total, no por cliente).**
   El salto que más fiabilidad compra es **Supabase Pro** (backups + sin pausa);
   después **Render Starter** (mata el cold start).
3. **Mantené WhatsApp reactivo y la IA en Haiku** para que el costo marginal por
   cliente quede en centavos.
4. **Dejá la IA y los recordatorios proactivos para cuando haya ingresos** — son los
   únicos rubros con costo por uso, y son baratos pero no nulos.

> Conclusión: el primer cliente gratis te cuesta **US$ 0**. Con clientes pagos, una
> base de **~US$ 33/mes cubre a todos** hasta volúmenes altos, con costo marginal
> por cliente cercano a cero.

---

## Fuentes

- Render — [pricing](https://render.com/pricing) · [resumen 2026](https://costbench.com/software/developer-tools/render/free-plan/)
- Supabase — [pricing](https://supabase.com/pricing) · [límites free 2026](https://aiagencyplus.com/supabase-free-tier-limits/)
- Vercel — [pricing](https://vercel.com/pricing) · [Hobby (no comercial)](https://vercel.com/docs/plans/hobby)
- Cloudflare Pages — [free plan](https://www.cloudflare.com/plans/free/) · [límites](https://developers.cloudflare.com/pages/platform/limits/)
- Netlify — [pricing](https://www.netlify.com/pricing/)
- Resend — [pricing](https://resend.com/pricing)
- WhatsApp Cloud API — [pricing oficial Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) · [resumen 2026](https://respond.io/blog/whatsapp-business-api-pricing)
- Google Business Profile API — [review data](https://developers.google.com/my-business/content/review-data)
- Anthropic (IA) — precios de la referencia oficial del SDK (Haiku 4.5: $1/$5; Opus 4.8: $5/$25 por millón de tokens)
