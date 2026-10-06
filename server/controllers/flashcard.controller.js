import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import { generateFlashcards } from '../services/ai.service.js';
import { logActivity } from '../services/activity.service.js';
import { schedule } from '../utils/sm2.js';
import { parseTzOffset } from '../utils/day.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/errors.js';

const MAX_CARDS_PER_DOCUMENT = 100;

// POST /api/flashcards/generate  { documentId }
export async function generateForDocument(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.body.documentId, user: req.user._id }).select(
      '+extractedText'
    );
    if (!doc) return fail(res, 'Document not found', 404);
    if (!doc.extractedText) return fail(res, 'Document has no extracted text yet', 400);

    const existing = await Flashcard.find({ user: req.user._id, document: doc._id }).select('front');
    if (existing.length >= MAX_CARDS_PER_DOCUMENT) {
      return fail(res, `This document already has the maximum of ${MAX_CARDS_PER_DOCUMENT} cards.`, 400);
    }

    const cards = await generateFlashcards(doc.extractedText);

    // Don't create duplicates when the student generates again.
    const known = new Set(existing.map((c) => c.front.toLowerCase()));
    const fresh = cards
      .filter((c) => !known.has(c.front.toLowerCase()))
      .slice(0, MAX_CARDS_PER_DOCUMENT - existing.length);

    if (fresh.length) {
      await Flashcard.insertMany(
        fresh.map((c) => ({ ...c, user: req.user._id, document: doc._id }))
      );
    }

    return ok(
      res,
      { created: fresh.length, total: existing.length + fresh.length },
      fresh.length ? 'Flashcards created' : 'No new flashcards (you already have these)',
      201
    );
  } catch (err) {
    logger.error('generateForDocument failed:', err);
    return sendError(res, err, 'Failed to generate flashcards');
  }
}

// GET /api/flashcards/due?limit=30  — the study queue
export async function getDueCards(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const now = new Date();
    const filter = { user: req.user._id };

    const [cards, dueCount, totalCount] = await Promise.all([
      Flashcard.find({ ...filter, dueAt: { $lte: now } })
        .sort({ dueAt: 1 })
        .limit(limit)
        .populate('document', 'fileName subject')
        .select('front back document'),
      Flashcard.countDocuments({ ...filter, dueAt: { $lte: now } }),
      Flashcard.countDocuments(filter),
    ]);

    return ok(res, { cards, dueCount, totalCount }, 'Due flashcards fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch flashcards', 500);
  }
}

// POST /api/flashcards/:id/review  { rating: 0 Again | 1 Hard | 2 Good | 3 Easy }
export async function reviewCard(req, res) {
  try {
    const card = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return fail(res, 'Flashcard not found', 404);

    const next = schedule(card, req.body.rating);
    Object.assign(card, next, { lastReviewedAt: new Date() });
    await card.save();

    await logActivity(req.user._id, parseTzOffset(req.headers['x-tz-offset']), { cards: 1 });

    return ok(res, { dueAt: card.dueAt, interval: card.interval }, 'Review saved');
  } catch (err) {
    logger.error('reviewCard failed:', err);
    return fail(res, 'Failed to save review', 500);
  }
}
