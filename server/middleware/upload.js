import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'revisioniq/documents',
    resource_type: 'raw', // PDFs are non-image assets on Cloudinary
    allowed_formats: ['pdf'],
  },
});

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB, per spec

function pdfOnlyFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are accepted.'));
  }
  cb(null, true);
}

export const uploadPdf = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: pdfOnlyFilter,
});
