# Frontend de Lince (`web/`)

Sitio en **Vite vanilla** (sin framework). Dos páginas:

- `/` → la **landing** (tu HTML original, migrado fielmente).
- `/admin/` → el **panel interno** (login con Supabase + listado de leads).

## Estructura

```
web/
├── index.html              # Landing (markup preservado 1:1)
├── admin/index.html        # Panel admin
├── public/                 # Imágenes (servidas en la raíz: /lince-faded.png)
├── src/
│   ├── main.js             # Entrada de la landing
│   ├── styles/landing.css  # CSS original + estilos del formulario
│   ├── landing/
│   │   ├── chatbot.js      # Demo de WhatsApp (original)
│   │   ├── reveal.js       # Scroll-reveal (original)
│   │   └── contact.js      # Formulario de leads → backend (nuevo)
│   ├── admin/              # admin.js + admin.css
│   └── lib/
│       ├── api.js          # Cliente HTTP del backend
│       └── supabase.js     # Cliente Supabase (solo admin, para login)
├── vite.config.js
└── .env.example
```

## Cómo correrlo en local

```bash
cd web
cp .env.example .env      # completá VITE_API_URL y, si vas a usar el panel, las de Supabase
npm install
npm run dev               # http://localhost:5173
```

## Build de producción

```bash
npm run build             # genera web/dist/
npm run preview           # previsualiza el build
```

## Deploy en Vercel

Ver `../docs/DEPLOY.md`. En resumen: Root Directory = `web`, Build Command =
`npm run build`, Output Directory = `dist`, y cargar las variables `VITE_*`.
