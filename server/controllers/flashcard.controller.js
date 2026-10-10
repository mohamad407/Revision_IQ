import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import crypto from 'node:crypto';
import Share from '../models/Share.js';
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

    const cards = await generateFlashcards(doc.extractedText, { language: req.user.language });

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
        .select('front back document deckName'),
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

// ---------------------------------------------------------------------------
// Sharing a deck: a snapshot anyone with the link can preview and copy to their account.
const MAX_SHARES_PER_USER = 20;
const MAX_CARDS_PER_USER = 2000;
const SHARE_DAYS = 90;
const newCode = () => crypto.randomBytes(9).toString('base64url'); // 12 URL-safe chars

// POST /api/flashcards/share  { documentId }
export async function shareDeck(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.body.documentId, user: req.user._id }).select('fileName subject');
    if (!doc) return fail(res, 'Document not found', 404);

    const cards = await Flashcard.find({ user: req.user._id, document: doc._id })
      .select('front back -_id')
      .limit(MAX_CARDS_PER_DOCUMENT)
      .lean();
    if (cards.length === 0) return fail(res, 'Make flashcards for this document first, then share them.', 400);

    const title = (doc.subject ? `${doc.subject} — ` : '') + doc.fileName.replace(/\.pdf$/i, '');
    const expiresAt = new Date(Date.now() + SHARE_DAYS * 24 * 60 * 60 * 1000);

    // Re-sharing the same document refreshes the existing link instead of creating a new one.
    let share = await Share.findOne({ owner: req.user._id, document: doc._id });
    if (share) {
      share.cards = cards;
      share.title = title.slice(0, 200);
      share.expiresAt = expiresAt;
      await share.save();
    } else {
      const count = await Share.countDocuments({ owner: req.user._id });
      if (count >= MAX_SHARES_PER_USER) {
        return fail(res, `You can have at most ${MAX_SHARES_PER_USER} shared decks. Delete one first.`, 400);
      }
      share = await Share.create({
        code: newCode(),
        owner: req.user._id,
        document: doc._id,
        title: title.slice(0, 200),
        cards,
        expiresAt,
      });
    }

    return ok(res, { code: share.code, count: cards.length, expiresAt }, 'Deck shared', 201);
  } catch (err) {
    logger.error('shareDeck failed:', err);
    return fail(res, 'Failed to share deck', 500);
  }
}

// DELETE /api/flashcards/share/:code  (owner only)
export async function unshareDeck(req, res) {
  try {
    const result = await Share.deleteOne({ code: req.params.code, owner: req.user._id });
    if (!result.deletedCount) return fail(res, 'Shared deck not found', 404);
    return ok(res, null, 'Sharing stopped');
  } catch (err) {
    return fail(res, 'Failed to stop sharing', 500);
  }
}

// GET /api/shared/:code  (PUBLIC) — preview only: title, count and the first 3 cards
export async function previewShared(req, res) {
  try {
    const share = await Share.findOne({ code: req.params.code }).select('title cards');
    if (!share) return fail(res, 'This shared deck does not exist or has expired.', 404);
    return ok(res, { title: share.title, count: share.cards.length, preview: share.cards.slice(0, 3) }, 'Shared deck');
  } catch (err) {
    return fail(res, 'Failed to load shared deck', 500);
  }
}

// POST /api/flashcards/import  { code }  — copies the whole deck into the student's account
export async function importShared(req, res) {
  try {
    const share = await Share.findOne({ code: req.body.code });
    if (!share) return fail(res, 'This shared deck does not exist or has expired.', 404);

    if (await Flashcard.exists({ user: req.user._id, sharedFrom: share.code })) {
      return fail(res, 'You already added this deck.', 409);
    }
    const have = await Flashcard.countDocuments({ user: req.user._id });
    if (have + share.cards.length > MAX_CARDS_PER_USER) {
      return fail(res, 'You have reached the flashcard limit. Delete some documents first.', 400);
    }

    await Flashcard.insertMany(
      share.cards.map((c) => ({
        user: req.user._id,
        front: c.front,
        back: c.back,
        deckName: share.title,
        sharedFrom: share.code,
      }))
    );
    return ok(res, { added: share.cards.length }, 'Deck added to your flashcards', 201);
  } catch (err) {
    logger.error('importShared failed:', err);
    return fail(res, 'Failed to add deck', 500);
  }
}
