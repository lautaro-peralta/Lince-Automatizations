/**
 * Subida de comprobantes — abstracción con proveedor intercambiable.
 *
 *   UPLOADS_PROVIDER=supabase     (Supabase Storage; activo. Tier gratuito de 1 GB)
 *   UPLOADS_PROVIDER=uploadthing  (todavía NO implementado; ver más abajo)
 *
 * El bucket es PRIVADO (recomendado para comprobantes financieros): no hay URL
 * pública fija. `uploadReceipt()` devuelve una `ref` ESTABLE (para guardar en
 * `expenses.receipt_url`) y `getSignedReceiptUrl()` la convierte, bajo demanda,
 * en un link firmado con vencimiento corto — se regenera en cada lectura desde
 * `routes/expenses.js`, así que el link mostrado siempre está vigente.
 */
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

// Prefijo que distingue "referencia interna a Storage" de un link/texto que el
// socio pegó a mano (una URL externa o un N.° de factura en texto libre).
const STORAGE_PREFIX = 'sb-storage:';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 6; // 6 horas: de sobra para una sesión de trabajo

async function toSupabase({ buffer, filename, mimetype }) {
  const bucket = config.uploads.supabaseBucket;
  const safe = filename.replace(/[^\w.\-]+/g, '_').slice(-80);
  const path = `${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimetype, upsert: false });
  if (error) {
    throw Object.assign(new Error('Falló la subida a Supabase Storage.'), { status: 502, cause: error });
  }
  // No hay `url` pública (bucket privado): la referencia estable es el path.
  return { ref: STORAGE_PREFIX + path, provider: 'supabase' };
}

/**
 * UploadThing — NO IMPLEMENTADO todavía. Queda solo como referencia de cómo
 * se integraría si en algún momento se vuelve a usar (no está instalado el
 * paquete `uploadthing`):
 *
 *   import { UTApi, UTFile } from 'uploadthing/server';
 *   const utapi = new UTApi({ token: config.uploads.uploadthingToken });
 *   const file = new UTFile([buffer], filename, { type: mimetype });
 *   const { data, error } = await utapi.uploadFiles(file);
 *   if (error) throw error;
 *   return { ref: data.ufsUrl, provider: 'uploadthing' }; // acá sí sería pública
 */
async function toUploadthing() {
  throw Object.assign(
    new Error('UploadThing no está implementado. Usá UPLOADS_PROVIDER=supabase.'),
    { status: 501 }
  );
}

/** Sube un comprobante con el proveedor configurado y devuelve su referencia estable. */
export async function uploadReceipt(fileInput) {
  return config.uploads.provider === 'uploadthing' ? toUploadthing(fileInput) : toSupabase(fileInput);
}

/**
 * Convierte una `receipt_url` guardada en un link usable para el navegador:
 *   · Referencia interna (`sb-storage:...`) -> link firmado, fresco, TTL corto.
 *   · Cualquier otro valor (link externo pegado a mano, N.° de factura, vacío)
 *     -> se devuelve tal cual; no todo lo que pega un socio es un archivo nuestro.
 * Si falla la firma (objeto borrado, bucket mal configurado) devuelve null en
 * vez de romper la lectura de gastos.
 */
export async function getSignedReceiptUrl(receiptUrl) {
  if (!receiptUrl || !receiptUrl.startsWith(STORAGE_PREFIX)) return receiptUrl || null;
  const path = receiptUrl.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabase.storage
    .from(config.uploads.supabaseBucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}
