/**
 * Punto de arranque del backend de Lince (Express).
 *
 * Monta middlewares globales, las rutas de la API y el manejo de errores,
 * y deja el servidor escuchando. Pensado para correr en Render.
 */
import express from 'express';
import cors from 'cors';

import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error.js';
import healthRouter from './routes/health.js';
import leadsRouter from './routes/leads.js';
import chatbotRouter from './routes/chatbot.js';
import budgetsRouter from './routes/budgets.js';
import reviewsRouter from './routes/reviews.js';
import statsRouter from './routes/stats.js';
import prospectsRouter from './routes/prospects.js';
import meRouter from './routes/me.js';
import expensesRouter from './routes/expenses.js';
import adsRouter from './routes/ads.js';
import uploadsRouter from './routes/uploads.js';
import subscriptionsRouter from './routes/subscriptions.js';
import okrsRouter from './routes/okrs.js';
import clientsRouter from './routes/clients.js';
import invoicesRouter from './routes/invoices.js';
import roadmapRouter from './routes/roadmap.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();

// Detrás de nginx (que manda X-Forwarded-For): sin esto req.ip es siempre
// 127.0.0.1 y el rate-limit de /api/prospects agrupa a todos los visitantes.
app.set('trust proxy', 1);

// Cuerpo JSON con límite chico: una landing/CRM no necesita payloads grandes.
app.use(express.json({ limit: '10kb' }));

// CORS: en producción restringimos al/los origen(es) del frontend.
// Si la lista está vacía (dev) permitimos cualquier origen. La comparación
// ignora la barra final y mayúsculas para evitar el error más típico de config.
const normalizeOrigin = (o) => (o || '').trim().replace(/\/+$/, '').toLowerCase();
const allowedOrigins = config.corsOrigins.map(normalizeOrigin);
app.use(
  cors({
    origin(origin, callback) {
      // Sin Origin (curl, health-check, server-to-server) → permitir.
      if (!origin) return callback(null, true);
      // Sin lista configurada → permitir todo (solo conviene en desarrollo).
      if (allowedOrigins.length === 0) return callback(null, true);
      return callback(null, allowedOrigins.includes(normalizeOrigin(origin)));
    },
  })
);

// Rutas
app.use('/health', healthRouter); // GET /health
app.use('/api/leads', leadsRouter); // captura y listado de leads
app.use('/api/chatbot', chatbotRouter); // demo conectado a la base (Fase 3)
app.use('/api/budgets', budgetsRouter); // presupuestos + seguimiento (Fase 4)
app.use('/api/reviews', reviewsRouter); // gestión de reseñas (Fase 3)
app.use('/api/stats', statsRouter);       // métricas del resumen (Fase 5)
app.use('/api/prospects', prospectsRouter); // prospectos del formulario web
app.use('/api/me', meRouter);               // identidad del Startup OS
app.use('/api/expenses', expensesRouter);   // gastos y aprobaciones (Startup OS)
app.use('/api/ads', adsRouter);             // rendimiento de anuncios (Startup OS)
app.use('/api/uploads', uploadsRouter);     // subida de comprobantes (Startup OS)
app.use('/api/subscriptions', subscriptionsRouter); // suscripciones SaaS (Startup OS)
app.use('/api/okrs', okrsRouter);           // OKRs y metas (Startup OS)
app.use('/api/clients', clientsRouter);     // clientes / CRM + salud (Startup OS)
app.use('/api/invoices', invoicesRouter);   // facturación (Startup OS)
app.use('/api/roadmap', roadmapRouter);     // roadmap de iniciativas (Startup OS)
app.use('/api/dashboard', dashboardRouter); // agregado del panel (Startup OS)

// 404 y manejador de errores SIEMPRE al final.
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Lince API escuchando en el puerto ${config.port}`);
});

export default app;
