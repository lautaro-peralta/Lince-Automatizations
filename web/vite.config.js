import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Configuración de Vite para un sitio MULTIPÁGINA en vanilla JS:
 *   - /          -> index.html        (la landing pública)
 *   - /admin/    -> admin/index.html  (el panel interno)
 *
 * No usamos ningún framework: Vite solo nos da dev server, variables de
 * entorno (VITE_*) y un build optimizado y versionado para Vercel.
 */
export default defineConfig({
  // Carpeta de salida del build que Vercel publica.
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
