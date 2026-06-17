# Contrato de API — Lince

Base URL: `VITE_API_URL` (ej. `http://localhost:3000` en local, la URL de
Render en producción). Todo es JSON.

## Convenciones

- Errores: `{ "message": "..." }` y, si aplica, `{ "errors": { campo: [...] } }`.
- Auth del panel: header `Authorization: Bearer <jwt-de-supabase>`.
- "admin" = JWT válido **y** rol `admin` en `profiles`.

---

## `GET /health` · público
Chequeo de vida (y keep-alive del free tier).
```json
200 { "ok": true, "service": "lince-api", "time": "2026-06-16T12:00:00.000Z" }
```

---

## Leads

### `POST /api/leads` · público
Crea un lead desde el formulario de la landing.
```json
// body
{ "name": "Juana", "business": "Kiosco", "contact": "juana@mail.com",
  "message": "Quiero automatizar pedidos", "website": "" }  // website = honeypot

201 { "ok": true }
400 { "message": "Datos inválidos.", "errors": { "contact": ["Contacto inválido"] } }
```
> Si `website` viene con contenido (bot), responde `201` pero **no guarda**.

### `GET /api/leads?status=&q=` · admin
Lista los leads, más nuevos primero. `status` filtra por estado; `q` busca en
nombre/negocio/contacto/mensaje.
```json
200 { "data": [ { "id": "...", "name": "...", "status": "nuevo", "notes": null, "created_at": "..." } ] }
```

### `PATCH /api/leads/:id` · admin
Actualiza estado y/o notas. Estados: `nuevo · contactado · en_conversacion · ganado · descartado`.
```json
// body (al menos uno)
{ "status": "contactado", "notes": "Llamar el lunes" }
200 { "data": { ...lead actualizado } }
```

---

## Presupuestos · admin

| Método | Ruta                | Cuerpo / notas |
|--------|---------------------|----------------|
| GET    | `/api/budgets?status=` | lista, filtro opcional |
| POST   | `/api/budgets`      | `{ customer_name, customer_contact, amount?, description?, business_id? }` |
| PATCH  | `/api/budgets/:id`  | `{ status?, amount?, description? }` |

Estados: `enviado · sin_respuesta · recordado · ganado · perdido`.

> El **disparo** de recordatorios no es un endpoint: lo hace `pg_cron` +
> la Edge Function `budget-followups` en Supabase (ver `supabase/README.md`).

---

## Reseñas · admin

| Método | Ruta                | Cuerpo / notas |
|--------|---------------------|----------------|
| GET    | `/api/reviews?status=` | lista, filtro opcional |
| PATCH  | `/api/reviews/:id`  | `{ status?, suggested_response?, priority? }` |

Estados: `nueva · analizando · respondida` (al marcar `respondida` se sella `responded_at`).

---

## Chatbot · público

| Método | Ruta                                   | Notas |
|--------|----------------------------------------|-------|
| GET    | `/api/chatbot/flows/:slug`             | devuelve el árbol (`tree`) del flujo activo |
| POST   | `/api/chatbot/sessions`                | `{ flow_id }` → crea sesión, devuelve `{ id }` |
| POST   | `/api/chatbot/sessions/:id/messages`   | `{ role, text, current_node?, state?, completed? }` |

> Hoy la demo de la landing corre con su árbol embebido (sigue funcionando sin
> backend). Estos endpoints permiten servir el flujo desde la base y registrar
> conversaciones; el cliente puede migrar a ellos una vez desplegado.
