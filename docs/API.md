# Contrato de API — Lince

Base URL: `VITE_API_URL` (ej. `http://localhost:3000` en local, la URL de
Render en producción). Todo es JSON.

## Convenciones

- Errores: `{ "message": "..." }` y, si aplica, `{ "errors": { campo: [...] } }`.
- Auth del panel: header `Authorization: Bearer <jwt-de-supabase>`.

---

## `GET /health` · público
Chequeo de vida (y keep-alive del free tier).

```json
200 { "ok": true, "service": "lince-api", "time": "2026-06-16T12:00:00.000Z" }
```

---

## `POST /api/leads` · público
Crea un lead desde el formulario de la landing.

**Body**
```json
{
  "name": "Juana Pérez",
  "business": "Kiosco La Esquina",   // opcional
  "contact": "juana@mail.com",        // email o WhatsApp
  "message": "Quiero automatizar los pedidos por WhatsApp",
  "website": ""                        // honeypot: debe ir vacío
}
```

**Respuestas**
```json
201 { "ok": true }
400 { "message": "Datos inválidos.", "errors": { "contact": ["Contacto inválido"] } }
```

> Si `website` viene con contenido (bot), responde `201` pero **no guarda**.

---

## `GET /api/leads` · admin
Lista los leads, más nuevos primero.

```json
200 { "data": [ { "id": "...", "name": "...", "contact": "...",
                  "message": "...", "status": "nuevo",
                  "created_at": "..." } ] }
401 { "message": "Falta el token de acceso." }
403 { "message": "No tenés permisos de administrador." }
```

---

## Planificados (stubs `501`)

### Chatbot (Fase 3)
- `GET  /api/chatbot/flows/:slug` — árbol de conversación del negocio.
- `POST /api/chatbot/sessions` — crea una sesión, devuelve `id`.
- `POST /api/chatbot/sessions/:id` — avanza la conversación (persiste estado).

### Presupuestos (Fase 4) · admin
- `GET   /api/budgets` — lista.
- `POST  /api/budgets` — alta.
- `PATCH /api/budgets/:id` — actualizar estado.

> El **disparo** de recordatorios no es un endpoint: lo hace `pg_cron` +
> Edge Function en Supabase (ver `supabase/README.md`).
