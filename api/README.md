# Backend de Lince (`api/`)

API REST en **Node.js + Express**. Se deploya en **Render**. Guarda los datos
en **Supabase** usando la *service-role key* (solo del servidor).

## Estructura

```
api/
├── src/
│   ├── server.js           # Arranque de Express (middlewares + rutas)
│   ├── config.js           # Variables de entorno centralizadas
│   ├── db/supabase.js      # Cliente Supabase con service-role
│   ├── middleware/
│   │   ├── auth.js         # requireAdmin (valida JWT + rol)
│   │   └── error.js        # 404 + manejador central de errores
│   └── routes/
│       ├── health.js       # GET /health
│       ├── leads.js        # POST/GET /api/leads  (funcional)
│       ├── chatbot.js      # /api/chatbot/*       (stub, Fase 3)
│       └── budgets.js      # /api/budgets/*       (stub, Fase 4)
└── .env.example
```

## Endpoints

| Método | Ruta                        | Acceso  | Estado |
|--------|-----------------------------|---------|--------|
| GET    | `/health`                   | público | ✅     |
| POST   | `/api/leads`                | público | ✅     |
| GET/PATCH | `/api/leads[/:id]`       | admin   | ✅     |
| GET/POST/PATCH | `/api/budgets[/:id]`| admin   | ✅     |
| GET/PATCH | `/api/reviews[/:id]`     | admin   | ✅     |
| POST   | `/api/reviews/:id/suggest`  | admin   | ✅ (IA) |
| GET    | `/api/stats`                | admin   | ✅     |
| *      | `/api/chatbot/*`            | público | ✅     |
| *      | `/api/me`, `/api/me/partners` | socio | ✅ (Startup OS) |
| *      | `/api/expenses`, `/api/ads`, `/api/subscriptions`, `/api/okrs`, `/api/clients`, `/api/invoices`, `/api/roadmap`, `/api/dashboard`, `/api/uploads` | socio | ✅ (Startup OS) |

Detalle completo del contrato en [`../docs/API.md`](../docs/API.md).

> **Lince Teams** (tablero, pizarra en tiempo real y transcripción) es un
> servicio aparte (repo `lince-teams`, Python/FastAPI): no vive en este backend.
> Comparte el login validando el JWT de Supabase. Ver `deploy/teams-proxy/`.

## Cómo correrlo en local

```bash
cd api
cp .env.example .env      # completá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev               # http://localhost:3000  (recarga con --watch)
```

Probar que vive:

```bash
curl http://localhost:3000/health
```

## Tests

Smoke tests sin dependencias ni DB real (notificaciones, fallback de IA,
protección de rutas):

```bash
npm test
```

## Deploy en Render

Ver `../docs/DEPLOY.md`. En resumen: Root Directory = `api`, Build Command =
`npm install`, Start Command = `npm start`, y cargar las variables de entorno.
