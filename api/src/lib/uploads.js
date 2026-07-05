/**
 * Subida de comprobantes — abstracción con dos proveedores intercambiables.
 *
 *   UPLOADS_PROVIDER=uploadthing  (por defecto, activo hoy)
 *   UPLOADS_PROVIDER=supabase     (Supabase Storage; tier gratuito de 1 GB)
 *
 * Ambos exponen el mismo contrato `uploadReceipt({ buffer, filename, mimetype })`
 * -> `{ url, key, provider }`, así cambiar de uno a otro es solo una variable de
 * entorno. El archivo llega desde la API (Express + multer), nunca del navegador
 * directo, y la URL resultante se guarda en `expenses.receipt_url`.
 */
import { UTApi, UTFile } from 'uploadthing/server';
import { config } from '../config.js';
import { supabase } from '../db/supabase.js';

let _utapi = null;
function utapi() {
  if (!config.uploads.uploadthingToken) {
    throw Object.assign(new Error('Falta UPLOADTHING_TOKEN en el servidor.'), { status: 503 });
  }
  if (!_utapi) _utapi = new UTApi({ token: config.uploads.uploadthingToken });
  return _utapi;
}

async function toUploadthing({ buffer, filename, mimetype }) {
  const file = new UTFile([buffer], filename, { type: mimetype });
  const out = await utapi().uploadFiles(file);
  const r = Array.isArray(out) ? out[0] : out;
  if (!r || r.error) {
    throw Object.assign(new Error('Falló la subida a UploadThing.'), {
      status: 502,
      cause: r && r.error,
    });
  }
  // v7 usa `ufsUrl`; `url` sigue disponible por compatibilidad.
  return { url: r.data.ufsUrl || r.data.url, key: r.data.key, provider: 'uploadthing' };
}

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

/** Sube un comprobante con el proveedor configurado y devuelve su URL. */
export async function uploadReceipt(fileInput) {
  return config.uploads.provider === 'supabase'
    ? toSupabase(fileInput)
    : toUploadthing(fileInput);
}
