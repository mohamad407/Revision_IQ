import Predictor from '../models/Predictor.js';
import { extractPdfWithOcr } from '../services/parser.service.js';
import {
  predictQuestions,
  extractTextFromImage,
  generateModelPaper,
  generateImportantTopics,
  evaluateAnswers,
  analyzeTopicFrequency,
} from '../services/ai.service.js';
import { uploadBufferToCloudinary, destroyCloudinaryAsset } from '../middleware/upload.js';
import { sanitizePattern } from '../utils/pattern.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/errors.js';

const MAX_SESSIONS_PER_USER = 50;
const MAX_PAPERS_PER_SESSION = 15;

// Never return the (large) extracted text or the private storage URLs.
const stripPapers = (predictor) => {
  const obj = predictor.toObject();
  obj.pastPapers = (obj.pastPapers || []).map(({ extractedText, cloudinaryUrl, ...rest }) => rest);
  return obj;
};

const pastPapersTextOf = (predictor) =>
  predictor.pastPapers
    .map((p) => `--- ${p.fileName} (${p.stage}) ---\n${p.extractedText || ''}`)
    .join('\n\n');

const findOwned = (req, { withText = false } = {}) => {
  const q = Predictor.findOne({ _id: req.params.id, user: req.user._id });
  return withText ? q.select('+pastPapers.extractedText') : q;
};

// POST /api/predictor  { subject, syllabusText, pattern }
export async function createPredictor(req, res) {
  try {
    const count = await Predictor.countDocuments({ user: req.user._id });
    if (count >= MAX_SESSIONS_PER_USER) {
      return fail(res, `You can have at most ${MAX_SESSIONS_PER_USER} predictor sessions.`, 400);
    }

    const { subject, syllabusText, pattern } = req.body;
    const predictor = await Predictor.create({
      user: req.user._id,
      subject,
      syllabusText: syllabusText || '',
      pattern: sanitizePattern(pattern),
    });

    return ok(res, stripPapers(predictor), 'Predictor session created', 201);
  } catch (err) {
    logger.error('createPredictor failed:', err);
    return fail(res, 'Failed to create predictor session', 500);
  }
}

// GET /api/predictor
export async function listPredictors(req, res) {
  try {
    const predictors = await Predictor.find({ user: req.user._id })
      .select('-pastPapers.extractedText')
      .sort({ createdAt: -1 })
      .limit(MAX_SESSIONS_PER_USER);
    return ok(res, predictors, 'Predictor sessions fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch predictor sessions', 500);
  }
}

// GET /api/predictor/:id
export async function getPredictor(req, res) {
  try {
    const predictor = await findOwned(req);
    if (!predictor) return fail(res, 'Predictor session not found', 404);
    return ok(res, stripPapers(predictor), 'Predictor session fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch predictor session', 500);
  }
}

// PUT /api/predictor/:id  { subject, syllabusText, pattern }
export async function updatePredictor(req, res) {
  try {
    const { subject, syllabusText, pattern } = req.body;
    const update = {};
    if (subject !== undefined) update.subject = subject;
    if (syllabusText !== undefined) update.syllabusText = syllabusText;
    if (pattern !== undefined) update.pattern = sanitizePattern(pattern);

    const predictor = await Predictor.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: update },
      { new: true, runValidators: true }
    ).select('-pastPapers.extractedText');

    if (!predictor) return fail(res, 'Predictor session not found', 404);
    return ok(res, stripPapers(predictor), 'Predictor session updated');
  } catch (err) {
    return fail(res, 'Failed to update predictor session', 500);
  }
}

// POST /api/predictor/:id/papers   multipart: file (pdf/jpg/png), stage
export async function uploadPastPaper(req, res) {
  let uploaded;
  try {
    if (!req.file) return fail(res, 'No file was uploaded', 400);

    const predictor = await findOwned(req);
    if (!predictor) return fail(res, 'Predictor session not found', 404);
    if (predictor.pastPapers.length >= MAX_PAPERS_PER_SESSION) {
      return fail(res, `Maximum ${MAX_PAPERS_PER_SESSION} past papers per session.`, 400);
    }

    // Extract first — invalid/corrupt files never reach storage.
    let text = '';
    try {
      if (req.file.mimetype === 'application/pdf') {
        text = (await extractPdfWithOcr(req.file.buffer)).text;
      } else {
        text = await extractTextFromImage(req.file.buffer.toString('base64'), req.file.mimetype);
      }
    } catch (err) {
      if (err.expose) return sendError(res, err); // AI down: say so instead of blaming the file
      return fail(res, 'Could not read this file. Try a clearer scan or a different PDF.', 422);
    }

    uploaded = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'revisioniq/past-papers',
      mimetype: req.file.mimetype,
    });

    predictor.pastPapers.push({
      fileName: req.file.originalname.slice(0, 255),
      mimeType: req.file.mimetype,
      stage: req.body.stage || 'unspecified',
      cloudinaryUrl: uploaded.url,
      cloudinaryPublicId: uploaded.publicId,
      cloudinaryType: uploaded.type,
      extractedText: text,
    });
    await predictor.save();

    return ok(res, stripPapers(predictor), 'Past paper uploaded', 201);
  } catch (err) {
    logger.error('uploadPastPaper failed:', err);
    if (uploaded) {
      await destroyCloudinaryAsset({
        publicId: uploaded.publicId,
        mimeType: req.file?.mimetype,
        type: uploaded.type,
      });
    }
    return sendError(res, err, 'Failed to process past paper');
  }
}

// DELETE /api/predictor/:id/papers/:paperId
export async function deletePastPaper(req, res) {
  try {
    const predictor = await findOwned(req);
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    const paper = predictor.pastPapers.id(req.params.paperId);
    if (!paper) return fail(res, 'Past paper not found', 404);

    await destroyCloudinaryAsset({
      publicId: paper.cloudinaryPublicId,
      mimeType: paper.mimeType,
      type: paper.cloudinaryType,
    });
    paper.deleteOne();
    await predictor.save();

    return ok(res, null, 'Past paper deleted');
  } catch (err) {
    return fail(res, 'Failed to delete past paper', 500);
  }
}

// POST /api/predictor/:id/generate
export async function generatePrediction(req, res) {
  try {
    // Atomic claim: blocks double-clicks / parallel runs from multiplying AI cost.
    const predictor = await Predictor.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        // a run stuck >5 min (crashed server / timeout) may be retried
        $or: [
          { status: { $ne: 'predicting' } },
          { updatedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
        ],
      },
      { $set: { status: 'predicting' } },
      { new: true }
    ).select('+pastPapers.extractedText');

    if (!predictor) {
      const exists = await Predictor.exists({ _id: req.params.id, user: req.user._id });
      return exists
        ? fail(res, 'A prediction is already running for this session.', 409)
        : fail(res, 'Predictor session not found', 404);
    }

    try {
      const predictions = await predictQuestions({
        subject: predictor.subject,
        syllabusText: predictor.syllabusText,
        pattern: predictor.pattern,
        pastPapersText: pastPapersTextOf(predictor),
      });
      predictor.predictions = predictions;
      predictor.status = 'ready';
    } catch (err) {
      predictor.status = 'failed';
      await predictor.save();
      throw err;
    }
    await predictor.save();

    return ok(res, stripPapers(predictor), 'Predictions generated');
  } catch (err) {
    logger.error('generatePrediction failed:', err);
    return sendError(res, err, 'Failed to generate predictions');
  }
}

// POST /api/predictor/:id/model-paper
export async function generateModelPaperForSession(req, res) {
  try {
    const predictor = await findOwned(req, { withText: true });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    predictor.modelPaper = await generateModelPaper({
      subject: predictor.subject,
      syllabusText: predictor.syllabusText,
      pattern: predictor.pattern,
      pastPapersText: pastPapersTextOf(predictor),
    });
    await predictor.save();

    return ok(res, stripPapers(predictor), 'Model paper generated');
  } catch (err) {
    logger.error('generateModelPaperForSession failed:', err);
    return sendError(res, err, 'Failed to generate model paper');
  }
}

// POST /api/predictor/:id/important-topics
export async function generateImportantTopicsForSession(req, res) {
  try {
    const predictor = await findOwned(req, { withText: true });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    predictor.importantTopics = await generateImportantTopics({
      subject: predictor.subject,
      syllabusText: predictor.syllabusText,
      pattern: predictor.pattern,
      pastPapersText: pastPapersTextOf(predictor),
    });
    await predictor.save();

    return ok(res, stripPapers(predictor), 'Important topics generated');
  } catch (err) {
    logger.error('generateImportantTopicsForSession failed:', err);
    return sendError(res, err, 'Failed to generate important topics');
  }
}

// DELETE /api/predictor/:id
export async function deletePredictor(req, res) {
  try {
    const predictor = await findOwned(req);
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    await Promise.all(
      predictor.pastPapers.map((p) =>
        destroyCloudinaryAsset({ publicId: p.cloudinaryPublicId, mimeType: p.mimeType, type: p.cloudinaryType })
      )
    );
    await predictor.deleteOne();

    return ok(res, null, 'Predictor session deleted');
  } catch (err) {
    return fail(res, 'Failed to delete predictor session', 500);
  }
}

// POST /api/predictor/:id/evaluate  { answers: [{ question, answer, marks }] }
// Used by "check my answer" (1 item) and the timed mock exam (whole paper, 1 AI call).
export async function evaluatePredictorAnswers(req, res) {
  try {
    const predictor = await findOwned(req);
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    const items = req.body.answers.map((a) => ({
      question: String(a.question).slice(0, 2000),
      answer: String(a.answer || '').slice(0, 4000),
      marks: Number(a.marks),
    }));

    const results = await evaluateAnswers({ subject: predictor.subject, items });
    const totalScore = results.reduce((n, r) => n + r.score, 0);
    const totalMarks = results.reduce((n, r) => n + r.marks, 0);

    return ok(res, { results, totalScore, totalMarks }, 'Answers evaluated');
  } catch (err) {
    logger.error('evaluatePredictorAnswers failed:', err);
    return sendError(res, err, 'Failed to evaluate answers');
  }
}

// POST /api/predictor/:id/topic-frequency
// Which topics keep coming back? Counts, per topic, how many of the uploaded past papers cover it.
export async function generateTopicFrequency(req, res) {
  try {
    const predictor = await findOwned(req, { withText: true });
    if (!predictor) return fail(res, 'Predictor session not found', 404);

    const papers = predictor.pastPapers
      .filter((p) => (p.extractedText || '').trim().length > 80)
      .slice(0, 8)
      .map((p) => ({ label: `${p.fileName} (${p.stage})`, text: p.extractedText }));
    if (papers.length === 0) {
      return fail(res, 'Upload at least one past paper (with readable text) first.', 400);
    }

    predictor.topicFrequency = await analyzeTopicFrequency({
      subject: predictor.subject,
      syllabusText: predictor.syllabusText,
      papers,
    });
    await predictor.save();

    return ok(res, stripPapers(predictor), 'Topic frequency generated');
  } catch (err) {
    logger.error('generateTopicFrequency failed:', err);
    return sendError(res, err, 'Failed to analyse topics');
  }
}
