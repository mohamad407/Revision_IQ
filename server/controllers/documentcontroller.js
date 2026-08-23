import axios from 'axios';
import Document from '../models/Document.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { extractPdfText } from '../services/parser.service.js';
import { generateSummary } from '../services/ai.service.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/documents/upload
// multer (via uploadPdf middleware) has already streamed the PDF to
// Cloudinary by the time this handler runs; req.file holds the result.
export async function uploadDocument(req, res) {
  let doc;
  try {
    if (!req.file) return fail(res, 'No PDF file was uploaded', 400);

    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    doc = await Document.create({
      user: user._id,
      fileName: req.file.originalname,
      subject: req.body.subject || '',
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      status: 'processing',
    });

    // Cloudinary already has the bytes; pull them back to extract text
    // rather than holding the whole buffer in memory during upload.
    const { data: pdfBuffer } = await axios.get(req.file.path, {
      responseType: 'arraybuffer',
    });

    const { text, pages } = await extractPdfText(pdfBuffer);
    const summary = await generateSummary(text);

    doc.extractedText = text;
    doc.pages = pages;
    doc.summary = summary;
    doc.status = 'ready';
    await doc.save();

    return ok(res, doc, 'Document uploaded and summarized', 201);
  } catch (err) {
    logger.error('uploadDocument failed:', err);
    if (doc) {
      doc.status = 'failed';
      await doc.save().catch(() => {});
    }
    return fail(res, 'Failed to process document', 500);
  }
}

// GET /api/documents
export async function listDocuments(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const docs = await Document.find({ user: user._id }).sort({ createdAt: -1 });
    return ok(res, docs, 'Documents fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch documents', 500);
  }
}

// GET /api/documents/:id
export async function getDocument(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const doc = await Document.findOne({ _id: req.params.id, user: user._id });
    if (!doc) return fail(res, 'Document not found', 404);

    return ok(res, doc, 'Document fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch document', 500);
  }
}

// DELETE /api/documents/:id
export async function deleteDocument(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const doc = await Document.findOne({ _id: req.params.id, user: user._id });
    if (!doc) return fail(res, 'Document not found', 404);

    await cloudinary.uploader.destroy(doc.cloudinaryPublicId, { resource_type: 'raw' });
    await doc.deleteOne();

    return ok(res, null, 'Document deleted');
  } catch (err) {
    return fail(res, 'Failed to delete document', 500);
  }
}
