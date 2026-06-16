// ============================================================================
// Edge Function: budget-followups  (Supabase / Deno)  — Fase 4
// ----------------------------------------------------------------------------
// Por qué vive acá y no en el backend de Render:
//   El server de Render (free) se DUERME tras unos minutos de inactividad, así
//   que no es fiable para tareas programadas. Supabase corre esta función con
//   pg_cron (ver supabase/README.md), independiente de Render → seguimiento
//   confiable de presupuestos.
//
// Qué hace (cuando se complete la Fase 4):
//   1. Busca presupuestos en estado 'enviado'/'sin_respuesta' con > 48 hs.
//   2. Envía un recordatorio (WhatsApp/email) al cliente.
//   3. Registra el envío en budget_followups y actualiza el presupuesto.
//
// Por ahora es un ESQUELETO: detecta los vencidos y los devuelve, sin enviar.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req: Request) => {
  // Estas variables las inyecta Supabase al desplegar la función.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Presupuestos sin respuesta con más de 48 horas desde el envío.
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: dueBudgets, error } = await supabase
    .from('budgets')
    .select('*')
    .in('status', ['enviado', 'sin_respuesta'])
    .lt('sent_at', cutoff);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // TODO (Fase 4): por cada presupuesto, enviar el recordatorio por el canal
  // correspondiente (ej. WhatsApp Cloud API / Resend) y luego:
  //   - insert en budget_followups
  //   - update budgets set status='recordado', followup_count = followup_count+1,
  //     last_followup_at = now()
  //
  // for (const b of dueBudgets ?? []) { await sendReminder(b); }

  return new Response(
    JSON.stringify({ ok: true, pending: dueBudgets?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
