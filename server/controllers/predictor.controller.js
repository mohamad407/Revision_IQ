import axios from 'axios';
import Predictor from '../models/Predictor.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { extractPdfText } from '../services/parser.service.js';
import { predictQuestions } from '../services/ai.service.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/predictor  { subject, syllabusText, pattern: { cat1, cat2, fat } }
// Pattern and syllabus are entirely user-entered, per the requirement that
// nothing here is scraped or guessed — the student defines what each stage
// looks like, and the AI only predicts within those constraints.
export async function createPredictor(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const { subject, syllabusText, pattern } = req.body;

    const predictor = await Predictor.create({
      user: user._id,
      subject,
      syllabusText: syllabusText || '',
      pattern: pattern || {},
    });

    return ok(res, predictor, 'Predictor session created', 201);
  } catch (err) {
    logger.error('createPredictor failed:', err);
    return fail(res, 'Failed to create predictor session', 500);
  }
}

// GET /api/predictor
export async function listPredictors(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictors = await Predictor.find({ user: user._id })
      .select('-pastPapers.extractedText')
      .sort({ createdAt: -1 });

    return ok(res, predictors, 'Predictor sessions fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch predictor sessions', 500);
  }
}

// GET /api/predictor/:id
export async function getPredictor(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictor = await Predictor.findOne({ _id: req.params.id, user: user._id }).select(
      '-pastPapers.extractedText'
    );
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    return ok(res, predictor, 'Predictor session fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch predictor session', 500);
  }
}

// PUT /api/predictor/:id  { subject, syllabusText, pattern }
// Lets the student edit the syllabus/pattern before generating.
export async function updatePredictor(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const { subject, syllabusText, pattern } = req.body;
    const update = {};
    if (subject !== undefined) update.subject = subject;
    if (syllabusText !== undefined) update.syllabusText = syllabusText;
    if (pattern !== undefined) update.pattern = pattern;

    const predictor = await Predictor.findOneAndUpdate(
      { _id: req.params.id, user: user._id },
      { $set: update },
      { new: true, runValidators: true }
    ).select('-pastPapers.extractedText');

    if (!predictor) return fail(res, 'Predictor session not found', 404);
    return ok(res, predictor, 'Predictor session updated');
  } catch (err) {
    return fail(res, 'Failed to update predictor session', 500);
  }
}

// POST /api/predictor/:id/papers   multipart: file (pdf), stage (cat1|cat2|fat|unspecified)
// Reuses the same Cloudinary + pdf-parse pipeline as document uploads —
// this is the "you upload it, we don't scrape it" path.
export async function uploadPastPaper(req, res) {
  try {
    if (!req.file) return fail(res, 'No PDF file was uploaded', 400);

    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictor = await Predictor.findOne({ _id: req.params.id, user: user._id });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    const { data: pdfBuffer } = await axios.get(req.file.path, { responseType: 'arraybuffer' });
    const { text } = await extractPdfText(pdfBuffer);

    predictor.pastPapers.push({
      fileName: req.file.originalname,
      stage: req.body.stage || 'unspecified',
      cloudinaryUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      extractedText: text,
    });
    await predictor.save();

    const response = predictor.toObject();
    response.pastPapers = response.pastPapers.map(({ extractedText, ...rest }) => rest);

    return ok(res, response, 'Past paper uploaded', 201);
  } catch (err) {
    logger.error('uploadPastPaper failed:', err);
    return fail(res, 'Failed to process past paper', 500);
  }
}

// DELETE /api/predictor/:id/papers/:paperId
export async function deletePastPaper(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictor = await Predictor.findOne({ _id: req.params.id, user: user._id });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    const paper = predictor.pastPapers.id(req.params.paperId);
    if (!paper) return fail(res, 'Past paper not found', 404);

    await cloudinary.uploader.destroy(paper.cloudinaryPublicId, { resource_type: 'raw' });
    paper.deleteOne();
    await predictor.save();

    return ok(res, null, 'Past paper deleted');
  } catch (err) {
    return fail(res, 'Failed to delete past paper', 500);
  }
}

// POST /api/predictor/:id/generate
// Runs the AI prediction for every stage the user has defined a pattern for.
export async function generatePrediction(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictor = await Predictor.findOne({ _id: req.params.id, user: user._id }).select(
      '+pastPapers.extractedText'
    );
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    predictor.status = 'predicting';
    await predictor.save();

    const pastPapersText = predictor.pastPapers
      .map((p) => `--- ${p.fileName} (${p.stage}) ---\n${p.extractedText || ''}`)
      .join('\n\n');

    const predictions = await predictQuestions({
      subject: predictor.subject,
      syllabusText: predictor.syllabusText,
      pattern: predictor.pattern,
      pastPapersText,
    });

    predictor.predictions = predictions;
    predictor.status = 'ready';
    await predictor.save();

    const response = predictor.toObject();
    response.pastPapers = response.pastPapers.map(({ extractedText, ...rest }) => rest);

    return ok(res, response, 'Predictions generated');
  } catch (err) {
    logger.error('generatePrediction failed:', err);
    await Predictor.findByIdAndUpdate(req.params.id, { status: 'failed' }).catch(() => {});
    return fail(res, 'Failed to generate predictions', 500);
  }
}

// DELETE /api/predictor/:id
export async function deletePredictor(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const predictor = await Predictor.findOne({ _id: req.params.id, user: user._id });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    await Promise.all(
      predictor.pastPapers.map((p) =>
        cloudinary.uploader.destroy(p.cloudinaryPublicId, { resource_type: 'raw' }).catch(() => {})
      )
    );
    await predictor.deleteOne();

    return ok(res, null, 'Predictor session deleted');
  } catch (err) {
    return fail(res, 'Failed to delete predictor session', 500);
  }
}
