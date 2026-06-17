# Modelo de datos — Lince

Esquema completo en `supabase/migrations/0001_init.sql`. Acá la vista de alto
nivel y el porqué de cada tabla.

## Tablas

| Tabla              | Para qué                                          | Fase |
|--------------------|---------------------------------------------------|------|
| `profiles`         | Rol de cada usuario de Auth (`admin`/`viewer`)    | 2    |
| `businesses`       | Negocios cliente (base multi-negocio)             | 3    |
| `leads`            | Contactos del formulario de la landing            | 1    |
| `chatbot_flows`    | Árbol de conversación como dato (no hardcodeado)  | 3    |
| `chatbot_sessions` | Estado de cada conversación del demo              | 3    |
| `chatbot_messages` | Log de mensajes (analítica)                       | 3    |
| `budgets`          | Presupuestos enviados + su estado                 | 4    |
| `budget_followups` | Log de recordatorios enviados por el cron         | 4    |
| `reviews`          | Reseñas detectadas para el monitor en vivo        | 3/5  |

## Relaciones

```
auth.users ─1:1─ profiles
businesses ─1:N─ chatbot_flows ─1:N─ chatbot_sessions ─1:N─ chatbot_messages
businesses ─1:N─ budgets ─1:N─ budget_followups
businesses ─1:N─ reviews
leads  (independiente; los leads aún no son un "business")
```

## Estados (campos `status`)

- **leads:** `nuevo → contactado → en_conversacion → ganado | descartado`
- **budgets:** `enviado → sin_respuesta → recordado → ganado | perdido`
- **reviews:** `nueva → analizando → respondida`

## Seguridad a nivel de fila (RLS)

- RLS **activado en todas** las tablas.
- **Sin políticas abiertas** (salvo "leer mi propio profile"): el acceso
  directo desde el navegador queda denegado.
- El backend usa la **service-role key**, que ignora RLS: todo el CRUD pasa,
  validado, por la API. Es defensa en profundidad.

## Notas

- Los `id` son `uuid` con `gen_random_uuid()`.
- `leads.business` es texto libre (lo escribe el visitante); recién en fases
  siguientes un lead podría convertirse en un `businesses` formal.
- El primer admin se promueve a mano (ver `supabase/README.md`).
