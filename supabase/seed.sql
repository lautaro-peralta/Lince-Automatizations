-- ============================================================================
-- Lince · Datos de ejemplo (seed)
-- ----------------------------------------------------------------------------
-- OPCIONAL. Cargá esto DESPUÉS de 0001_init.sql para tener datos con los que
-- probar el panel y los endpoints (chatbot, reseñas, presupuestos).
--   Supabase Studio → SQL Editor → pegar y Run   (o `supabase db reset` con CLI)
-- Es idempotente: se puede correr varias veces sin duplicar.
-- ============================================================================

-- Negocio de demostración.
insert into public.businesses (name, slug)
values ('Parrilla El Fogón', 'parrilla-el-fogon')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Flujo del chatbot como DATO (versión de datos del árbol embebido en el front).
-- Estructura por nodo: { bot:[...], options:[{label,next,set}], input:{...},
-- confirm:true, end:true }. El cliente podrá renderizarlo sin hardcodear.
-- ----------------------------------------------------------------------------
insert into public.chatbot_flows (business_id, slug, name, tree)
select
  b.id,
  'parrilla-el-fogon',
  'Atención Parrilla El Fogón',
  '{
    "start": {
      "bot": ["¡Hola! 👋 Soy el asistente de Parrilla El Fogón. ¿En qué te puedo ayudar?"],
      "options": [
        {"label": "Quiero reservar una mesa", "next": "reserva_personas"},
        {"label": "Quiero pedir delivery", "next": "delivery_zona"},
        {"label": "¿Hasta qué hora abren?", "next": "consulta_horario"}
      ]
    },
    "reserva_personas": {
      "bot": ["¡Buenísimo! ¿Para cuántas personas sería?"],
      "options": [
        {"label": "2 personas", "next": "reserva_dia", "set": {"personas": "2 personas"}},
        {"label": "4 personas", "next": "reserva_dia", "set": {"personas": "4 personas"}}
      ]
    },
    "reserva_dia": {
      "bot": ["Perfecto. ¿Qué día te queda cómodo?"],
      "options": [
        {"label": "Hoy", "next": "reserva_confirma", "set": {"dia": "hoy"}},
        {"label": "Este sábado", "next": "reserva_confirma", "set": {"dia": "sábado"}}
      ]
    },
    "reserva_confirma": {
      "bot": ["¡Listo! Tu mesa quedó reservada. Te esperamos 🔥"],
      "confirm": true,
      "end": true
    },
    "delivery_zona": {
      "bot": ["¡Dale! ¿A qué zona sería el envío?"],
      "options": [
        {"label": "Centro", "next": "delivery_confirma", "set": {"zona": "Centro"}},
        {"label": "Pichincha", "next": "delivery_confirma", "set": {"zona": "Pichincha"}}
      ]
    },
    "delivery_confirma": {
      "bot": ["¡Pedido tomado! Te avisamos cuando salga para tu dirección 🛵"],
      "confirm": true,
      "end": true
    },
    "consulta_horario": {
      "bot": ["Hoy atendemos de 20:00 a 00:00 🕗. ¿Querés que te reserve una mesa?"],
      "options": [
        {"label": "Sí, reservar", "next": "reserva_personas"},
        {"label": "No, gracias", "next": "consulta_cierre"}
      ]
    },
    "consulta_cierre": {
      "bot": ["¡De nada! Cualquier cosa escribinos cuando quieras ☀️"],
      "end": true
    }
  }'::jsonb
from public.businesses b
where b.slug = 'parrilla-el-fogon'
on conflict (business_id, slug) do nothing;

-- ----------------------------------------------------------------------------
-- Reseñas de ejemplo.
-- ----------------------------------------------------------------------------
insert into public.reviews (business_id, source, rating, author, text, status, priority)
select b.id, 'google', 1, 'Ana', 'Esperé 40 minutos pasado mi turno y nadie me avisó nada.', 'nueva', 'urgente'
from public.businesses b where b.slug = 'parrilla-el-fogon';

insert into public.reviews (business_id, source, rating, author, text, status, priority)
select b.id, 'google', 5, 'Marcos', 'Excelente atención y la comida espectacular. Volvemos seguro.', 'respondida', 'baja'
from public.businesses b where b.slug = 'parrilla-el-fogon';

-- ----------------------------------------------------------------------------
-- Presupuestos de ejemplo (uno viejo para que dispare el seguimiento).
-- ----------------------------------------------------------------------------
insert into public.budgets (business_id, customer_name, customer_contact, amount, description, sent_at, status)
select b.id, 'Carlos Ruiz', '+54 341 555-1234', 85000, 'Service completo de moto', now() - interval '3 days', 'enviado'
from public.businesses b where b.slug = 'parrilla-el-fogon';

insert into public.budgets (business_id, customer_name, customer_contact, amount, description, sent_at, status)
select b.id, 'Lucía Gómez', 'lucia@mail.com', 120000, 'Cambio de cubiertas + alineación', now() - interval '1 day', 'enviado'
from public.businesses b where b.slug = 'parrilla-el-fogon';
