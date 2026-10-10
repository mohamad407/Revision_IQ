import User from '../models/User.js';
import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import Flashcard from '../models/Flashcard.js';
import Share from '../models/Share.js';
import Predictor from '../models/Predictor.js';
import Feedback from '../models/Feedback.js';
import Activity from '../models/Activity.js';
import { firebaseAuth } from '../config/firebase.js';
import { addDays, dayKey } from '../utils/day.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/overview
export async function overview(req, res) {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekKey = addDays(dayKey(0), -6);

    const [users, newUsers, disabledUsers, documents, ocrDocs, quizzes, flashcards, predictors, shares, openFeedback, activeIds, dailyRows] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ disabled: true }),
        Document.countDocuments(),
        Document.countDocuments({ ocr: true }),
        Quiz.countDocuments(),
        Flashcard.countDocuments(),
        Predictor.countDocuments(),
        Share.countDocuments(),
        Feedback.countDocuments({ status: 'open' }),
        Activity.distinct('user', { day: { $gte: weekKey } }),
        Activity.aggregate([
          { $match: { day: { $gte: weekKey } } },
          { $group: { _id: '$day', quizzes: { $sum: '$quizzes' }, cards: { $sum: '$cards' }, students: { $addToSet: '$user' } } },
          { $project: { _id: 0, day: '$_id', quizzes: 1, cards: 1, students: { $size: '$students' } } },
          { $sort: { day: 1 } },
        ]),
      ]);

    return ok(res, {
      users: { total: users, new7d: newUsers, active7d: activeIds.length, disabled: disabledUsers },
      content: { documents, scannedDocuments: ocrDocs, quizzes, flashcards, predictorSessions: predictors, sharedDecks: shares },
      openFeedback,
      daily: dailyRows,
    }, 'Overview');
  } catch (err) {
    logger.error('admin overview failed:', err);
    return fail(res, 'Failed to load overview', 500);
  }
}

// GET /api/admin/users?page=1&q=
export async function listUsers(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;
    const q = String(req.query.q || '').trim().slice(0, 100);
    const filter = q ? { $or: [{ email: new RegExp(escapeRegex(q), 'i') }, { name: new RegExp(escapeRegex(q), 'i') }] } : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select('name email role disabled createdAt lastLogin language'),
      User.countDocuments(filter),
    ]);

    // Document counts for just this page of users
    const counts = await Document.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) } } },
      { $group: { _id: '$user', n: { $sum: 1 } } },
    ]);
    const byUser = new Map(counts.map((c) => [String(c._id), c.n]));

    return ok(res, {
      page, pages: Math.max(Math.ceil(total / limit), 1), total,
      users: users.map((u) => ({ ...u.toObject(), documents: byUser.get(String(u._id)) || 0 })),
    }, 'Users');
  } catch (err) {
    logger.error('admin listUsers failed:', err);
    return fail(res, 'Failed to load users', 500);
  }
}

// POST /api/admin/users/:id/disabled  { disabled: true|false }
export async function setUserDisabled(req, res) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return fail(res, 'User not found', 404);
    if (target.role === 'admin') return fail(res, 'Admins cannot be disabled here.', 400);

    target.disabled = req.body.disabled;
    await target.save();
    // Also block the Firebase login itself (and revoke existing sessions).
    await firebaseAuth.updateUser(target.firebaseUid, { disabled: target.disabled }).catch((e) => logger.error('firebase disable failed:', e.message));
    if (target.disabled) await firebaseAuth.revokeRefreshTokens(target.firebaseUid).catch(() => {});

    return ok(res, { id: target._id, disabled: target.disabled }, target.disabled ? 'User disabled' : 'User enabled');
  } catch (err) {
    logger.error('admin setUserDisabled failed:', err);
    return fail(res, 'Failed to update user', 500);
  }
}

// GET /api/admin/feedback?status=open
export async function listFeedback(req, res) {
  try {
    const filter = req.query.status === 'done' ? { status: 'done' } : { status: 'open' };
    const items = await Feedback.find(filter).sort({ createdAt: -1 }).limit(100);
    return ok(res, items, 'Feedback');
  } catch (err) {
    return fail(res, 'Failed to load feedback', 500);
  }
}

// POST /api/admin/feedback/:id/done
export async function resolveFeedback(req, res) {
  try {
    const item = await Feedback.findByIdAndUpdate(req.params.id, { status: 'done' }, { new: true });
    if (!item) return fail(res, 'Feedback not found', 404);
    return ok(res, item, 'Marked as done');
  } catch (err) {
    return fail(res, 'Failed to update feedback', 500);
  }
}
