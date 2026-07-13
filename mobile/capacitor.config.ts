import type { CapacitorConfig } from '@capacitor/cli';

/* App móvil de Lince: shell nativo que carga el origen unificado en producción
   (Panel /admin + Startup OS + Teams comparten ese origen y el login de
   Supabase, así que no hay CORS ni auth aparte). El webDir local solo aporta
   error.html para cuando no hay conexión.

   La URL se puede pisar al compilar (entornos de prueba):
     CAP_SERVER_URL=https://staging.ejemplo.com npx cap sync

   El UA lleva "LinceApp": las webs lo detectan y cargan /app-shell.js
   (barra inferior entre apps, botón atrás de Android, status bar). */
const config: CapacitorConfig = {
  appId: 'ar.com.linceautomate.app',
  appName: 'Lince',
  webDir: 'web',
  backgroundColor: '#F7F5F0',
  server: {
    url: process.env.CAP_SERVER_URL || 'https://lince-automate.com.ar/admin',
    errorPath: 'error.html'
  },
  android: {
    appendUserAgent: 'LinceApp'
  },
  ios: {
    appendUserAgent: 'LinceApp'
  },
  plugins: {
    SplashScreen: {
      /* autoHide a los 3 s como red de seguridad; app-shell.js lo oculta antes
         en cuanto la web carga (si el puente no está, el timer resuelve). */
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#F7F5F0',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F7F5F0'
    },
    SystemBars: {
      /* Inyecta --safe-area-inset-* como variables CSS en el WebView Android
         (edge-to-edge de Android 15+); las webs ya las consumen via --sat/--sab. */
      insetsHandling: 'css'
    }
  }
};

export default config;
