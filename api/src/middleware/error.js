/**
 * Middleware central de manejo de errores.
 *
 * Cualquier `next(err)` o excepción en una ruta async (que llame next(err))
 * termina acá. Logueamos el detalle en el servidor pero al cliente solo le
 * devolvemos un mensaje seguro (sin filtrar internals en errores 500).
 */
export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  const status = err.status || 500;
  const message = status === 500 ? 'Error interno del servidor.' : err.message;
  res.status(status).json({ message });
}

/** 404 para rutas no registradas. */
export function notFound(_req, res) {
  res.status(404).json({ message: 'Ruta no encontrada.' });
}
