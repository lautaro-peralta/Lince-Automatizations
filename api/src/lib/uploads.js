/**
 * Subida de comprobantes — abstracción con proveedor intercambiable.
 *
 *   UPLOADS_PROVIDER=supabase     (Supabase Storage; activo. Tier gratuito de 1 GB)
 *   UPLOADS_PROVIDER=uploadthing  (todavía NO implementado; ver más abajo)
 *
 * El contrato es `uploadReceipt({ buffer, filename, mimetype })` ->
 * `{ url, key, provider }`. El archivo llega desde la API (Express + multer),
 * nunca del navegador directo, y la URL resultante se guarda en
 * `expenses.receipt_url`.
 */
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

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
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, key: path, provider: 'supabase' };
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
 *   return { url: data.ufsUrl, key: data.key, provider: 'uploadthing' };
 */
async function toUploadthing() {
  throw Object.assign(
    new Error('UploadThing no está implementado. Usá UPLOADS_PROVIDER=supabase.'),
    { status: 501 }
  );
}

/** Sube un comprobante con el proveedor configurado y devuelve su URL. */
export async function uploadReceipt(fileInput) {
  return config.uploads.provider === 'uploadthing' ? toUploadthing(fileInput) : toSupabase(fileInput);
}
