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

const app = express();

// Cuerpo JSON con límite chico: una landing/CRM no necesita payloads grandes.
app.use(express.json({ limit: '10kb' }));

// CORS: en producción restringimos al/los origen(es) del frontend (Vercel).
// Si la lista está vacía (dev) permitimos cualquier origen.
app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
  })
);

// Rutas
app.use('/health', healthRouter); // GET /health
app.use('/api/leads', leadsRouter); // captura y listado de leads
app.use('/api/chatbot', chatbotRouter); // demo conectado a la base (Fase 3)
app.use('/api/budgets', budgetsRouter); // presupuestos + seguimiento (Fase 4)
app.use('/api/reviews', reviewsRouter); // gestión de reseñas (Fase 3)
app.use('/api/stats', statsRouter); // métricas del resumen (Fase 5)

// 404 y manejador de errores SIEMPRE al final.
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Lince API escuchando en el puerto ${config.port}`);
});

export default app;
