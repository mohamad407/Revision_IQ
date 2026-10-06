import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractPdfText } from '../services/parser.service.js';
import { generateSummary } from '../services/ai.service.js';
import { uploadBufferToCloudinary, destroyCloudinaryAsset } from '../middleware/upload.js';
import { sendError } from '../utils/errors.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/documents/upload
// multer holds the PDF in memory and verifyFileSignature has confirmed it is
// really a PDF. We parse FIRST (so garbage never reaches storage), then store
// it privately on Cloudinary.
export async function uploadDocument(req, res) {
  let uploaded;
  try {
    if (!req.file) return fail(res, 'No PDF file was uploaded', 400);

    let parsed;
    try {
      parsed = await extractPdfText(req.file.buffer);
    } catch {
      return fail(res, 'Could not read this PDF. It may be corrupted or password-protected.', 422);
    }

    uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'revisioniq/documents',
      mimetype: 'application/pdf',
    });

    const summary = await generateSummary(parsed.text);

    const doc = await Document.create({
      user: req.user._id,
      fileName: req.file.originalname.slice(0, 255),
      subject: req.body.subject || '',
      cloudinaryUrl: uploaded.url,
      cloudinaryPublicId: uploaded.publicId,
      cloudinaryType: uploaded.type,
      extractedText: parsed.text,
      pages: parsed.pages,
      summary,
      status: 'ready',
    });

    const safe = doc.toObject();
    delete safe.extractedText;
    delete safe.cloudinaryUrl;
    return ok(res, safe, 'Document uploaded and summarized', 201);
  } catch (err) {
    logger.error('uploadDocument failed:', err);
    // Don't leave orphaned private files behind if DB/AI steps failed.
    if (uploaded) {
      await destroyCloudinaryAsset({ publicId: uploaded.publicId, mimeType: 'application/pdf', type: uploaded.type });
    }
    return fail(res, 'Failed to process document', 500);
  }
}

// GET /api/documents
export async function listDocuments(req, res) {
  try {
    const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(200);
    return ok(res, docs, 'Documents fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch documents', 500);
  }
}

// GET /api/documents/:id
export async function getDocument(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return fail(res, 'Document not found', 404);
    return ok(res, doc, 'Document fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch document', 500);
  }
}

// DELETE /api/documents/:id
export async function deleteDocument(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return fail(res, 'Document not found', 404);

    await destroyCloudinaryAsset({
      publicId: doc.cloudinaryPublicId,
      mimeType: 'application/pdf',
      type: doc.cloudinaryType,
    });
    await Promise.all([
      Flashcard.deleteMany({ user: req.user._id, document: doc._id }),
      Quiz.deleteMany({ user: req.user._id, document: doc._id }),
    ]);
    await doc.deleteOne();

    return ok(res, null, 'Document deleted');
  } catch (err) {
    return fail(res, 'Failed to delete document', 500);
  }
}

// POST /api/documents/:id/summary
// Re-runs the AI summary (e.g. when the AI was down during upload).
export async function regenerateSummary(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user._id }).select('+extractedText');
    if (!doc) return fail(res, 'Document not found', 404);
    if (!doc.extractedText) return fail(res, 'This document has no readable text (it may be a scanned PDF).', 400);

    doc.summary = await generateSummary(doc.extractedText, { strict: true });
    await doc.save();

    const safe = doc.toObject();
    delete safe.extractedText;
    return ok(res, safe, 'Summary regenerated');
  } catch (err) {
    logger.error('regenerateSummary failed:', err);
    return sendError(res, err, 'Failed to regenerate summary');
  }
}
