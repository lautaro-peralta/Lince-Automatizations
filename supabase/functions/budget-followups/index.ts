// ============================================================================
// Edge Function: budget-followups  (Supabase / Deno)  — Fase 4
// ----------------------------------------------------------------------------
// Por qué vive acá y no en el backend de Render:
//   El server de Render (free) se DUERME tras unos minutos de inactividad, así
//   que no es fiable para tareas programadas. Supabase corre esta función con
//   pg_cron (ver supabase/README.md), independiente de Render → seguimiento
//   confiable de presupuestos.
//
// Qué hace:
//   1. Busca presupuestos 'enviado'/'sin_respuesta' con > 48 hs sin respuesta.
//   2. Por cada uno: "envía" un recordatorio (HOY es un stub que loguea; el
//      envío real por WhatsApp/email es el punto de integración marcado abajo).
//   3. Registra el envío en budget_followups y actualiza el presupuesto.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Horas sin respuesta a partir de las cuales recordamos.
const FOLLOWUP_AFTER_HOURS = 48;

Deno.serve(async (_req: Request) => {
  // Estas variables las inyecta Supabase al desplegar la función.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const cutoff = new Date(Date.now() - FOLLOWUP_AFTER_HOURS * 3600 * 1000).toISOString();

  // Presupuestos candidatos a recordatorio.
  const { data: dueBudgets, error } = await supabase
    .from('budgets')
    .select('*')
    .in('status', ['enviado', 'sin_respuesta'])
    .lt('sent_at', cutoff);

  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  let sent = 0;
  for (const b of dueBudgets ?? []) {
    // Elegimos el canal según el contacto (heurística simple).
    const channel = String(b.customer_contact).includes('@') ? 'email' : 'whatsapp';
    const message =
      `Hola ${b.customer_name}, te recordamos el presupuesto que te pasamos. ` +
      `¿Lo pudiste ver? Quedamos a disposición para cualquier duda.`;

    // ── PUNTO DE INTEGRACIÓN ──────────────────────────────────────────────
    // TODO: enviar de verdad por WhatsApp Cloud API / Resend.
    //   await sendReminder(channel, b.customer_contact, message);
    // Por ahora solo lo registramos para no enviar mensajes en pruebas.
    // ──────────────────────────────────────────────────────────────────────

    // Log del recordatorio.
    const { error: logErr } = await supabase.from('budget_followups').insert({
      budget_id: b.id,
      channel,
      message,
    });
    if (logErr) continue; // no frenamos todo el lote por uno

    // Actualizamos el presupuesto.
    await supabase
      .from('budgets')
      .update({
        status: 'recordado',
        followup_count: (b.followup_count ?? 0) + 1,
        last_followup_at: new Date().toISOString(),
      })
      .eq('id', b.id);

    sent += 1;
  }

  return json({ ok: true, candidates: dueBudgets?.length ?? 0, sent });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
