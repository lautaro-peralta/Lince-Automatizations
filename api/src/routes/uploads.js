/**
 * Ruta de SUBIDA DE COMPROBANTES del Startup OS.
 *
 *   POST /api/uploads  -> socio. Recibe UN archivo (imagen o PDF) como
 *   multipart/form-data (campo `file`), lo sube con el proveedor configurado
 *   (UploadThing / Supabase Storage) y devuelve `{ url, provider }`.
 *
 * La URL se guarda luego en `expenses.receipt_url` al registrar el gasto.
 */
import { Router } from 'express';
import multer from 'multer';
import { requireSocio } from '../middleware/auth.js';
import { uploadReceipt } from '../lib/uploads.js';

const router = Router();

const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'application/pdf',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8 MB, un archivo
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Tipo de archivo no permitido (usá imagen o PDF).'), { status: 400 }));
  },
});

// POST /api/uploads — socio (auth ANTES de leer el archivo)
router.post('/', requireSocio, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo supera el máximo de 8 MB.'
          : err.message || 'Archivo inválido.';
      return res.status(err.status || 400).json({ message: msg });
    }
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });
    try {
      const { url, provider } = await uploadReceipt({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
      });
      return res.status(201).json({ data: { url, provider } });
    } catch (e) {
      return res.status(e.status || 500).json({ message: e.message || 'No se pudo subir el archivo.' });
    }
  });
});

export default router;
