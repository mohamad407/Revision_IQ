import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { HttpError } from '../utils/errors.js';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

// Files are held in memory (never written to disk), validated by their REAL
// bytes, parsed, and only then pushed to Cloudinary as *private*
// ("authenticated") assets. This replaces multer-storage-cloudinary, which
// uploaded publicly before any validation could happen.
const memory = multer.memoryStorage();

const ALLOWED = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

function makeUploader(allowedMimes, message) {
  return multer({
    storage: memory,
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 10 },
    fileFilter(req, file, cb) {
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new HttpError(400, message));
      }
      cb(null, true);
    },
  });
}

export const uploadPdf = makeUploader(['application/pdf'], 'Only PDF files are accepted.');
export const uploadPastPaperFile = makeUploader(
  ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  'Only PDF, JPG, or PNG files are accepted.'
);

// The Content-Type header is client-controlled, so check the actual magic bytes.
function detectType(buf) {
  if (!buf || buf.length < 8) return null;
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png';
  return null;
}

// Runs after multer. Overwrites file.mimetype with the verified type.
export function verifyFileSignature(req, res, next) {
  if (!req.file) return next();
  const real = detectType(req.file.buffer);
  const declared = req.file.mimetype === 'image/jpg' ? 'image/jpeg' : req.file.mimetype;
  if (!real || real !== declared || !ALLOWED[real]) {
    return next(new HttpError(400, 'File content does not match its type, or is not allowed.'));
  }
  req.file.mimetype = real;
  next();
}

// Uploads a buffer as a PRIVATE asset. Returns { url, publicId, resourceType, type }.
export function uploadBufferToCloudinary(buffer, { folder, mimetype }) {
  const resource_type = mimetype === 'application/pdf' ? 'raw' : 'image';
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, type: 'authenticated', overwrite: false },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: resource_type,
          type: 'authenticated',
        });
      }
    );
    stream.end(buffer);
  });
}

// Best-effort delete that works for both new (authenticated) and legacy (public) assets.
export async function destroyCloudinaryAsset({ publicId, mimeType, type }) {
  const resource_type = mimeType?.startsWith('image/') ? 'image' : 'raw';
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type, type: type || 'upload' });
  } catch {
    /* ignore — DB record removal must not depend on storage cleanup */
  }
}
