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

// Separate storage config for previous-year papers: accepts PDFs AND
// photos/scans (jpg, png), since most students only have phone photos of
// old papers, not clean PDFs. resource_type 'auto' lets Cloudinary store
// each correctly (raw for PDFs, image for photos) from one multer instance.
const pastPaperStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'revisioniq/past-papers',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  },
});

const ACCEPTED_PAST_PAPER_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function pastPaperFilter(req, file, cb) {
  if (!ACCEPTED_PAST_PAPER_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPG, or PNG files are accepted.'));
  }
  cb(null, true);
}

export const uploadPastPaperFile = multer({
  storage: pastPaperStorage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: pastPaperFilter,
});
