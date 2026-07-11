/**
 * Catálogo de herramientas del servidor MCP del Startup OS.
 *
 * Cada herramienta es un PUENTE declarativo hacia un endpoint REST existente:
 * acá solo se describe (nombre, schema de entrada) y se arma el request; la
 * validación fina y TODAS las reglas de negocio (anti-fraude de gastos, etc.)
 * siguen viviendo en las rutas de Express. Así no hay dos fuentes de verdad.
 *
 * Convenciones:
 *   · `request(args)` -> { method, path, query?, body? }. Los campos undefined
 *     no viajan (los PATCH exigen "algo para actualizar").
 *   · `postFilter(data, args)` filtra en memoria cuando el endpoint no acepta
 *     ese filtro por query (listas cortas: no vale la pena tocar la API).
 *   · Sin deletes: borrar de verdad queda para la app, a propósito.
 */
import { z } from 'zod';
import {
  EXPENSE_STATUSES,
  EXPENSE_CATEGORIES,
  AD_CHANNELS,
  CURRENCIES,
  SUBSCRIPTION_STATUSES,
  BILLING_CYCLES,
  OKR_STATUSES,
  CLIENT_STATUSES,
  CLIENT_HEALTH,
  INVOICE_STATUSES,
  ROADMAP_STATUSES,
} from '../constants.js';

const currency = z.enum(CURRENCIES).describe('Moneda: ARS o USD.');
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Fecha YYYY-MM-DD.');
const quarterStr = z
  .string()
  .regex(/^\d{4}-Q[1-4]$/)
  .describe("Trimestre 'YYYY-Q1'..'YYYY-Q4'.");
const uuid = z.string().uuid();

/** Copia `args` sin las claves undefined (los PATCH rechazan cuerpos vacíos). */
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const TOOLS = [
  // ── Lectura ───────────────────────────────────────────────────────────────
  {
    name: 'get_dashboard',
    title: 'Dashboard general',
    description:
      'Resumen ejecutivo del Startup OS en una sola llamada: gastos pendientes de aprobación y totales del mes, ROAS/CAC de anuncios, costo mensual de suscripciones y próximas renovaciones, MRR y clientes en riesgo de churn, cobranzas pendientes y OKRs activos con avance. Usala primero para tener contexto.',
    readOnly: true,
    input: {},
    request: () => ({ method: 'GET', path: '/api/dashboard' }),
  },
  {
    name: 'list_expenses',
    title: 'Listar gastos',
    description:
      'Gastos registrados con su bitácora de aprobaciones (quién registró, quién aprobó/rechazó y cuándo). Un gasto que supera el umbral crítico (USD 50 / ARS 50.000) necesita 2 aprobaciones de socios distintos.',
    readOnly: true,
    input: {
      status: z.enum(EXPENSE_STATUSES).optional().describe('Filtrar por estado.'),
    },
    request: () => ({ method: 'GET', path: '/api/expenses' }),
    postFilter: (data, args) =>
      args.status ? data.filter((e) => e.status === args.status) : data,
  },
  {
    name: 'list_clients',
    title: 'Listar clientes',
    description:
      'Cartera de clientes de la agencia con plan, MRR, estado (activo/pausado/baja) y salud (saludable/en_riesgo/critico). El MRR de los activos es el MRR real del negocio.',
    readOnly: true,
    input: {
      status: z.enum(CLIENT_STATUSES).optional().describe('Filtrar por estado.'),
      health: z.enum(CLIENT_HEALTH).optional().describe('Filtrar por salud.'),
    },
    request: () => ({ method: 'GET', path: '/api/clients' }),
    postFilter: (data, args) =>
      data.filter(
        (c) =>
          (!args.status || c.status === args.status) &&
          (!args.health || c.health === args.health)
      ),
  },
  {
    name: 'list_invoices',
    title: 'Listar facturas',
    description:
      "Facturas emitidas con su estado de cobro. Cobranzas pendientes = 'enviada' + 'vencida'.",
    readOnly: true,
    input: {
      status: z.enum(INVOICE_STATUSES).optional().describe('Filtrar por estado.'),
    },
    request: () => ({ method: 'GET', path: '/api/invoices' }),
    postFilter: (data, args) =>
      args.status ? data.filter((i) => i.status === args.status) : data,
  },
  {
    name: 'list_subscriptions',
    title: 'Listar suscripciones SaaS',
    description:
      'Inventario de suscripciones SaaS recurrentes con costo mensual normalizado (una anual reparte en 12) y fecha de renovación.',
    readOnly: true,
    input: {
      status: z.enum(SUBSCRIPTION_STATUSES).optional().describe('Filtrar por estado.'),
    },
    request: () => ({ method: 'GET', path: '/api/subscriptions' }),
    postFilter: (data, args) =>
      args.status ? data.filter((s) => s.status === args.status) : data,
  },
  {
    name: 'list_okrs',
    title: 'Listar OKRs',
    description:
      'Objetivos por trimestre con sus key results y avance calculado (promedio de min(current/target, 1)).',
    readOnly: true,
    input: {
      status: z.enum(OKR_STATUSES).optional().describe('activo o archivado.'),
    },
    request: (args) => ({
      method: 'GET',
      path: '/api/okrs',
      query: { status: args.status },
    }),
  },
  {
    name: 'list_roadmap',
    title: 'Listar roadmap',
    description:
      'Iniciativas del roadmap por trimestre, con estado (idea/planeado/en_curso/hecho/pausado) y el OKR al que aportan.',
    readOnly: true,
    input: {
      quarter: quarterStr.optional().describe('Filtrar por trimestre.'),
      status: z.enum(ROADMAP_STATUSES).optional().describe('Filtrar por estado.'),
    },
    request: () => ({ method: 'GET', path: '/api/roadmap' }),
    postFilter: (data, args) =>
      data.filter(
        (i) =>
          (!args.quarter || i.quarter === args.quarter) &&
          (!args.status || i.status === args.status)
      ),
  },
  {
    name: 'get_ads_performance',
    title: 'Rendimiento de anuncios',
    description:
      'Métricas de anuncios por período (mes) y canal, con ROAS (revenue/spend) y CAC (spend/conversions) calculados.',
    readOnly: true,
    input: {
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .optional()
        .describe("Mes 'YYYY-MM'. Sin período devuelve todos."),
    },
    request: (args) => ({
      method: 'GET',
      path: '/api/ads',
      query: { period: args.period },
    }),
  },
  {
    name: 'list_partners',
    title: 'Listar socios',
    description:
      'Integrantes con acceso al Startup OS (id, nombre y rol). Usala para obtener el uuid de un socio antes de asignarlo como dueño de un OKR o iniciativa.',
    readOnly: true,
    input: {},
    request: () => ({ method: 'GET', path: '/api/me/partners' }),
  },

  // ── Escritura ─────────────────────────────────────────────────────────────
  {
    name: 'create_expense',
    title: 'Registrar gasto',
    description:
      'Registra un gasto que queda PENDIENTE de aprobación por otro socio (nadie aprueba su propio gasto). Si supera USD 50 / ARS 50.000 requiere dos aprobaciones.',
    input: {
      amount: z.number().positive().describe('Monto del gasto.'),
      currency,
      category: z.enum(EXPENSE_CATEGORIES).describe('Categoría del gasto.'),
      description: z.string().min(2).max(500).describe('Qué se compró y para qué.'),
      provider: z.string().max(160).optional().describe('Proveedor o comercio.'),
      receipt_url: z
        .string()
        .max(2000)
        .optional()
        .describe('Link o referencia del comprobante.'),
    },
    request: (args) => ({ method: 'POST', path: '/api/expenses', body: clean(args) }),
  },
  {
    name: 'decide_expense',
    title: 'Aprobar o rechazar gasto',
    description:
      'Aprueba o rechaza un gasto pendiente. Reglas del servidor: no podés decidir sobre un gasto que registraste vos, y no podés aprobar dos veces el mismo gasto.',
    input: {
      expense_id: uuid.describe('Id del gasto (de list_expenses o get_dashboard).'),
      decision: z.enum(['aprobar', 'rechazar']).describe('Qué hacer con el gasto.'),
      note: z.string().max(500).optional().describe('Nota opcional para la bitácora.'),
    },
    request: (args) => ({
      method: 'POST',
      path: `/api/expenses/${args.expense_id}/${args.decision === 'aprobar' ? 'approve' : 'reject'}`,
      body: clean({ note: args.note }),
    }),
  },
  {
    name: 'create_client',
    title: 'Alta de cliente',
    description: 'Da de alta un cliente en la cartera (un lead ganado se "gradúa" acá).',
    input: {
      name: z.string().min(2).max(160).describe('Nombre del cliente.'),
      contact: z.string().max(200).optional().describe('Email / WhatsApp / contacto.'),
      plan: z.string().max(80).optional().describe("Plan contratado, ej. 'Growth'."),
      mrr: z.number().nonnegative().optional().describe('Ingreso recurrente mensual.'),
      currency: currency.optional(),
      status: z.enum(CLIENT_STATUSES).optional(),
      health: z.enum(CLIENT_HEALTH).optional(),
      since: dateStr.optional().describe('Cliente desde.'),
      notes: z.string().max(1000).optional().describe('Señales, contexto, próximo paso.'),
    },
    request: (args) => ({ method: 'POST', path: '/api/clients', body: clean(args) }),
  },
  {
    name: 'update_client',
    title: 'Editar cliente',
    description:
      "Edita un cliente: cambiar salud ('en_riesgo'/'critico' alimenta el churn), MRR, estado (la baja real de negocio es status 'baja'), notas, etc. Solo los campos enviados se modifican.",
    input: {
      client_id: uuid.describe('Id del cliente (de list_clients).'),
      name: z.string().min(2).max(160).optional(),
      contact: z.string().max(200).optional(),
      plan: z.string().max(80).optional(),
      mrr: z.number().nonnegative().optional(),
      currency: currency.optional(),
      status: z.enum(CLIENT_STATUSES).optional(),
      health: z.enum(CLIENT_HEALTH).optional(),
      since: dateStr.optional(),
      notes: z.string().max(1000).optional(),
    },
    request: ({ client_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/clients/${client_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'create_invoice',
    title: 'Emitir factura',
    description:
      'Emite una factura a un cliente (borrador o enviada). `client_name` queda como snapshot aunque el cliente se borre.',
    input: {
      client_name: z.string().min(2).max(160).describe('Nombre del cliente facturado.'),
      client_id: uuid.optional().describe('Id del cliente si existe en la cartera.'),
      number: z.string().max(60).optional().describe('N.º de factura (libre).'),
      amount: z.number().nonnegative().describe('Monto.'),
      currency: currency.optional(),
      status: z.enum(INVOICE_STATUSES).optional().describe("Por defecto 'borrador'."),
      issued_on: dateStr.optional().describe('Fecha de emisión.'),
      due_on: dateStr.optional().describe('Fecha de vencimiento.'),
      notes: z.string().max(1000).optional(),
    },
    request: (args) => ({ method: 'POST', path: '/api/invoices', body: clean(args) }),
  },
  {
    name: 'update_invoice',
    title: 'Editar factura',
    description:
      "Edita una factura o cambia su estado: marcar 'pagada' al cobrar, 'vencida' o 'anulada'. Solo los campos enviados se modifican.",
    input: {
      invoice_id: uuid.describe('Id de la factura (de list_invoices).'),
      client_name: z.string().min(2).max(160).optional(),
      number: z.string().max(60).optional(),
      amount: z.number().nonnegative().optional(),
      currency: currency.optional(),
      status: z.enum(INVOICE_STATUSES).optional(),
      issued_on: dateStr.optional(),
      due_on: dateStr.optional(),
      notes: z.string().max(1000).optional(),
    },
    request: ({ invoice_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/invoices/${invoice_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'create_subscription',
    title: 'Alta de suscripción SaaS',
    description: 'Agrega una suscripción SaaS al inventario de gastos recurrentes.',
    input: {
      name: z.string().min(2).max(160).describe("Ej: 'Figma Organization'."),
      vendor: z.string().max(160).optional().describe('Proveedor / empresa.'),
      seats: z.number().int().min(1).max(10000).optional().describe('Asientos.'),
      amount: z.number().nonnegative().describe('Costo POR CICLO de facturación.'),
      currency: currency.optional(),
      billing_cycle: z.enum(BILLING_CYCLES).optional().describe("Por defecto 'mensual'."),
      renews_on: dateStr.optional().describe('Próxima renovación.'),
      notes: z.string().max(500).optional(),
    },
    request: (args) => ({ method: 'POST', path: '/api/subscriptions', body: clean(args) }),
  },
  {
    name: 'update_subscription',
    title: 'Editar suscripción SaaS',
    description:
      "Edita una suscripción: pausar/cancelar vía status, actualizar monto o renovación. La baja real se registra con status 'cancelada' (no se borra). Solo los campos enviados se modifican.",
    input: {
      subscription_id: uuid.describe('Id de la suscripción (de list_subscriptions).'),
      name: z.string().min(2).max(160).optional(),
      vendor: z.string().max(160).optional(),
      seats: z.number().int().min(1).max(10000).optional(),
      amount: z.number().nonnegative().optional(),
      currency: currency.optional(),
      billing_cycle: z.enum(BILLING_CYCLES).optional(),
      renews_on: dateStr.optional(),
      status: z.enum(SUBSCRIPTION_STATUSES).optional(),
      notes: z.string().max(500).optional(),
    },
    request: ({ subscription_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/subscriptions/${subscription_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'create_okr',
    title: 'Crear objetivo (OKR)',
    description:
      'Crea un objetivo trimestral, opcionalmente con sus key results iniciales (medibles: target > 0).',
    input: {
      quarter: quarterStr,
      title: z.string().min(2).max(200).describe('El objetivo.'),
      owner: uuid.optional().describe('Uuid del socio dueño (de list_partners).'),
      key_results: z
        .array(
          z.object({
            title: z.string().min(2).max(200),
            unit: z.string().max(20).optional().describe("Ej: 'US$', 'clientes', '%'."),
            target: z.number().positive().describe('Meta a alcanzar.'),
            current: z.number().nonnegative().optional().describe('Valor actual.'),
          })
        )
        .max(8)
        .optional()
        .describe('Key results iniciales.'),
    },
    request: (args) => ({ method: 'POST', path: '/api/okrs', body: clean(args) }),
  },
  {
    name: 'update_okr',
    title: 'Editar objetivo (OKR)',
    description:
      "Edita título/trimestre/dueño de un objetivo o lo archiva (status 'archivado'). Solo los campos enviados se modifican.",
    input: {
      objective_id: uuid.describe('Id del objetivo (de list_okrs).'),
      title: z.string().min(2).max(200).optional(),
      quarter: quarterStr.optional(),
      owner: uuid.optional().describe('Uuid del socio dueño (de list_partners).'),
      status: z.enum(OKR_STATUSES).optional(),
    },
    request: ({ objective_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/okrs/${objective_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'add_key_result',
    title: 'Agregar key result',
    description: 'Agrega un key result medible a un objetivo existente.',
    input: {
      objective_id: uuid.describe('Id del objetivo (de list_okrs).'),
      title: z.string().min(2).max(200),
      unit: z.string().max(20).optional().describe("Ej: 'US$', 'clientes', '%'."),
      target: z.number().positive().describe('Meta a alcanzar.'),
      current: z.number().nonnegative().optional().describe('Valor actual.'),
    },
    request: ({ objective_id, ...rest }) => ({
      method: 'POST',
      path: `/api/okrs/${objective_id}/key-results`,
      body: clean(rest),
    }),
  },
  {
    name: 'update_key_result',
    title: 'Check-in de key result',
    description:
      'Actualiza un key result: el check-in típico es actualizar `current` con el valor real (el avance del objetivo se recalcula solo). Solo los campos enviados se modifican.',
    input: {
      key_result_id: uuid.describe('Id del key result (de list_okrs).'),
      title: z.string().min(2).max(200).optional(),
      unit: z.string().max(20).optional(),
      target: z.number().positive().optional(),
      current: z.number().nonnegative().optional().describe('Nuevo valor real.'),
    },
    request: ({ key_result_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/okrs/key-results/${key_result_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'create_roadmap_item',
    title: 'Crear iniciativa de roadmap',
    description:
      'Crea una iniciativa en el roadmap trimestral, opcionalmente enlazada a un OKR (objective_id).',
    input: {
      title: z.string().min(2).max(200).describe('La iniciativa.'),
      quarter: quarterStr,
      status: z.enum(ROADMAP_STATUSES).optional().describe("Por defecto 'planeado'."),
      objective_id: uuid.optional().describe('OKR al que aporta (de list_okrs).'),
      owner: uuid.optional().describe('Uuid del socio dueño (de list_partners).'),
      notes: z.string().max(1000).optional(),
    },
    request: (args) => ({ method: 'POST', path: '/api/roadmap', body: clean(args) }),
  },
  {
    name: 'update_roadmap_item',
    title: 'Editar iniciativa de roadmap',
    description:
      'Edita una iniciativa o mueve su estado (idea → planeado → en_curso → hecho). Solo los campos enviados se modifican.',
    input: {
      item_id: uuid.describe('Id de la iniciativa (de list_roadmap).'),
      title: z.string().min(2).max(200).optional(),
      quarter: quarterStr.optional(),
      status: z.enum(ROADMAP_STATUSES).optional(),
      objective_id: uuid.optional(),
      owner: uuid.optional(),
      notes: z.string().max(1000).optional(),
    },
    request: ({ item_id, ...rest }) => ({
      method: 'PATCH',
      path: `/api/roadmap/${item_id}`,
      body: clean(rest),
    }),
  },
  {
    name: 'record_ad_metrics',
    title: 'Cargar métricas de anuncios',
    description:
      'Carga (o corrige: es upsert por período+canal) las métricas de un canal de anuncios para un mes. ROAS y CAC se calculan solos.',
    input: {
      period: z
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .describe("Mes 'YYYY-MM'."),
      channel: z.enum(AD_CHANNELS).describe('Canal de anuncios.'),
      spend: z.number().nonnegative().optional().describe('Inversión del mes.'),
      revenue: z.number().nonnegative().optional().describe('Ingresos atribuidos.'),
      conversions: z.number().int().nonnegative().optional().describe('Conversiones.'),
    },
    request: (args) => ({ method: 'POST', path: '/api/ads', body: clean(args) }),
  },
];
