/**
 * Ruta del DASHBOARD del Startup OS.
 *
 *   GET /api/dashboard -> socio. Agregado de todos los módulos en UNA llamada:
 *     · gastos: pendientes (con bitácora, listos para aprobar/rechazar) y
 *       totales del mes por moneda (aprobado / rechazado / mes anterior);
 *     · anuncios: resumen del último período cargado (ROAS/CAC combinados);
 *     · suscripciones: costo mensual activo por moneda y próximas renovaciones;
 *     · clientes: MRR real de clientes activos y cartera en riesgo de churn;
 *     · facturación: cobranzas pendientes y cobrado del mes;
 *     · okrs: objetivos activos con su avance.
 *
 * Todo se calcula acá para que el panel muestre SIEMPRE datos reales y no
 * duplique reglas de negocio en el navegador.
 */
import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireSocio } from '../middleware/auth.js';
import { APPROVAL_THRESHOLDS } from '../constants.js';
import { attachDetails } from './expenses.js';

const router = Router();

/** { USD: 0, ARS: 0 } — acumulador por moneda para no mezclar unidades. */
const zeroByCurrency = () => ({ USD: 0, ARS: 0 });

function addByCurrency(acc, currency, amount) {
  const key = currency === 'ARS' ? 'ARS' : 'USD';
  acc[key] += Number(amount);
  return acc;
}

const monthKey = (date) => date.toISOString().slice(0, 7); // 'YYYY-MM'

// GET /api/dashboard — socio
router.get('/', requireSocio, async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [pendingQ, recentQ, adsQ, subsQ, clientsQ, invoicesQ, okrsQ] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('amount, currency, status, created_at')
        .gte('created_at', prevMonthStart.toISOString()),
      supabase
        .from('ad_metrics')
        .select('period, spend, revenue, conversions')
        .order('period', { ascending: false }),
      supabase.from('subscriptions').select('*').neq('status', 'cancelada'),
      supabase.from('clients').select('*'),
      supabase.from('invoices').select('amount, currency, status, issued_on'),
      supabase
        .from('okr_objectives')
        .select('*')
        .eq('status', 'activo')
        .order('quarter', { ascending: false })
        .order('created_at', { ascending: true }),
    ]);
    for (const q of [pendingQ, recentQ, adsQ, subsQ, clientsQ, invoicesQ, okrsQ]) {
      if (q.error) throw q.error;
    }

    // ── Gastos ──────────────────────────────────────────────────────────────
    const pending = await attachDetails(pendingQ.data || []);
    const pendingTotal = zeroByCurrency();
    pending.forEach((e) => addByCurrency(pendingTotal, e.currency, e.amount));

    const thisKey = monthKey(monthStart);
    const prevKey = monthKey(prevMonthStart);
    const approved = zeroByCurrency();
    const rejected = zeroByCurrency();
    const prevApproved = zeroByCurrency();
    for (const e of recentQ.data || []) {
      const key = monthKey(new Date(e.created_at));
      if (e.status === 'aprobado' && key === thisKey) addByCurrency(approved, e.currency, e.amount);
      if (e.status === 'rechazado' && key === thisKey) addByCurrency(rejected, e.currency, e.amount);
      if (e.status === 'aprobado' && key === prevKey)
        addByCurrency(prevApproved, e.currency, e.amount);
    }

    // ── Anuncios: agregado del último período cargado ────────────────────────
    const adRows = adsQ.data || [];
    let ads = null;
    if (adRows.length) {
      const latest = adRows[0].period;
      const rows = adRows.filter((r) => r.period === latest);
      const spend = rows.reduce((a, r) => a + Number(r.spend), 0);
      const revenue = rows.reduce((a, r) => a + Number(r.revenue), 0);
      const conversions = rows.reduce((a, r) => a + Number(r.conversions), 0);
      ads = {
        period: latest,
        spend,
        revenue,
        conversions,
        channels: rows.length,
        roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : null,
        cac: conversions > 0 ? Number((spend / conversions).toFixed(2)) : null,
      };
    }

    // ── Suscripciones (activas y pausadas; el costo solo suma las activas) ──
    const subs = subsQ.data || [];
    const active = subs.filter((s) => s.status === 'activa');
    const monthlyCost = zeroByCurrency();
    active.forEach((s) =>
      addByCurrency(
        monthlyCost,
        s.currency,
        s.billing_cycle === 'anual' ? Number(s.amount) / 12 : Number(s.amount)
      )
    );
    const cutoff = in30Days.toISOString().slice(0, 10);
    const renewingSoon = active
      .filter((s) => s.renews_on && s.renews_on <= cutoff)
      .sort((a, b) => (a.renews_on < b.renews_on ? -1 : 1))
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor,
        amount: Number(s.amount),
        currency: s.currency,
        billing_cycle: s.billing_cycle,
        renews_on: s.renews_on,
      }));

    // ── Clientes: MRR real (activos) + riesgo de churn ───────────────────────
    const clients = clientsQ.data || [];
    const activeClients = clients.filter((c) => c.status === 'activo');
    const mrr = zeroByCurrency();
    activeClients.forEach((c) => addByCurrency(mrr, c.currency, c.mrr));
    // En riesgo: clientes activos con salud comprometida, del que más MRR pone
    // en juego al que menos (así se prioriza a quién retener primero).
    const HEALTH_RANK = { critico: 0, en_riesgo: 1 };
    const atRisk = activeClients
      .filter((c) => c.health === 'critico' || c.health === 'en_riesgo')
      .sort((a, b) => {
        if (HEALTH_RANK[a.health] !== HEALTH_RANK[b.health])
          return HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
        return Number(b.mrr) - Number(a.mrr);
      })
      .slice(0, 6)
      .map((c) => ({
        id: c.id,
        name: c.name,
        plan: c.plan,
        mrr: Number(c.mrr),
        currency: c.currency,
        health: c.health,
        notes: c.notes,
      }));
    const mrrAtRisk = zeroByCurrency();
    activeClients
      .filter((c) => c.health === 'critico' || c.health === 'en_riesgo')
      .forEach((c) => addByCurrency(mrrAtRisk, c.currency, c.mrr));

    // ── Facturación: cobranzas pendientes + cobrado del mes ───────────────────
    const invoices = invoicesQ.data || [];
    const outstanding = zeroByCurrency(); // enviada + vencida
    const overdue = zeroByCurrency(); // solo vencida
    const collectedMonth = zeroByCurrency(); // pagada, emitida este mes
    let overdueCount = 0;
    for (const inv of invoices) {
      if (inv.status === 'enviada' || inv.status === 'vencida')
        addByCurrency(outstanding, inv.currency, inv.amount);
      if (inv.status === 'vencida') {
        addByCurrency(overdue, inv.currency, inv.amount);
        overdueCount++;
      }
      if (inv.status === 'pagada' && (inv.issued_on || '').slice(0, 7) === thisKey)
        addByCurrency(collectedMonth, inv.currency, inv.amount);
    }

    // ── OKRs activos con avance ──────────────────────────────────────────────
    const objectives = okrsQ.data || [];
    let okrs = [];
    if (objectives.length) {
      const ids = objectives.map((o) => o.id);
      const [krsQ, ownersQ] = await Promise.all([
        supabase.from('okr_key_results').select('objective_id, target, current').in('objective_id', ids),
        supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', [...new Set(objectives.map((o) => o.owner).filter(Boolean))]),
      ]);
      if (krsQ.error) throw krsQ.error;
      if (ownersQ.error) throw ownersQ.error;
      const nameOf = Object.fromEntries((ownersQ.data || []).map((p) => [p.id, p.full_name]));
      const byObjective = {};
      for (const kr of krsQ.data || []) (byObjective[kr.objective_id] ||= []).push(kr);
      okrs = objectives.slice(0, 8).map((o) => {
        const krs = byObjective[o.id] || [];
        const progress = krs.length
          ? Math.round(
              (krs.reduce((a, kr) => a + Math.min(Number(kr.current) / Number(kr.target), 1), 0) /
                krs.length) *
                100
            )
          : 0;
        return {
          id: o.id,
          title: o.title,
          quarter: o.quarter,
          owner_name: o.owner ? nameOf[o.owner] || null : null,
          kr_count: krs.length,
          progress,
        };
      });
    }

    return res.json({
      data: {
        generated_at: now.toISOString(),
        approval_thresholds: APPROVAL_THRESHOLDS,
        expenses: {
          pending,
          pending_count: pending.length,
          pending_total: pendingTotal,
          month: {
            period: thisKey,
            approved,
            rejected,
            prev_approved: prevApproved,
          },
        },
        ads,
        subscriptions: {
          active_count: active.length,
          monthly_cost: {
            USD: Number(monthlyCost.USD.toFixed(2)),
            ARS: Number(monthlyCost.ARS.toFixed(2)),
          },
          renewing_soon: renewingSoon,
        },
        clients: {
          active_count: activeClients.length,
          total_count: clients.length,
          mrr,
          at_risk: atRisk,
          at_risk_count: atRisk.length,
          mrr_at_risk: mrrAtRisk,
        },
        invoices: {
          outstanding,
          overdue,
          overdue_count: overdueCount,
          collected_month: collectedMonth,
        },
        okrs,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
