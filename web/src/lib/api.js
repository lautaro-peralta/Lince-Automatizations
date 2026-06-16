/**
 * Cliente HTTP mínimo hacia el backend de Lince (Express en Render).
 *
 * La URL base se lee de una variable de entorno de Vite (VITE_API_URL),
 * así nunca queda hardcodeada y cambia sola entre desarrollo y producción.
 * En dev cae por defecto al backend local (http://localhost:3000).
 */

// import.meta.env.* lo inyecta Vite en tiempo de build a partir del .env.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

/**
 * Realiza una petición JSON al backend.
 * @param {string} path  Ruta relativa, ej: '/api/leads'.
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {object} [options.body]   Se serializa a JSON.
 * @param {string} [options.token]  JWT opcional (para rutas del panel admin).
 * @returns {Promise<any>} El cuerpo JSON de la respuesta.
 * @throws {Error} Con `.status` y `.data` si el backend responde con error.
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // El servidor de Render puede estar "despertando" (cold start) o sin red.
    const err = new Error('No pudimos conectar con el servidor. Reintentá en un momento.');
    err.cause = networkErr;
    err.status = 0;
    throw err;
  }

  // Algunas respuestas (ej. 204) no traen cuerpo.
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const err = new Error((data && data.message) || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export { API_URL };
