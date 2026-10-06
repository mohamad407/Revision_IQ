import Activity from '../models/Activity.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import Document from '../models/Document.js';
import { addDays, dayKey, parseTzOffset } from '../utils/day.js';
import { computeStreak } from '../utils/streak.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// GET /api/stats  — everything the dashboard needs in one request
export async function getStats(req, res) {
  try {
    const userId = req.user._id;
    const today = dayKey(parseTzOffset(req.headers['x-tz-offset']));
    const since = addDays(today, -364);

    const [activity, quizzes, dueCards, totalCards, documents] = await Promise.all([
      Activity.find({ user: userId, day: { $gte: since } }).select('day quizzes cards -_id'),
      Quiz.find({ user: userId })
        .select('document attempts.score attempts.total')
        .populate('document', 'fileName subject')
        .limit(300),
      Flashcard.countDocuments({ user: userId, dueAt: { $lte: new Date() } }),
      Flashcard.countDocuments({ user: userId }),
      Document.countDocuments({ user: userId }),
    ]);

    // Streak
    const activeDays = activity.filter((a) => a.quizzes + a.cards > 0).map((a) => a.day);
    const streak = computeStreak(activeDays, today);

    // Last 7 days (oldest -> newest) for the activity chart
    const byDay = new Map(activity.map((a) => [a.day, a.quizzes + a.cards]));
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6);
      return { day, count: byDay.get(day) || 0 };
    });
    const todayRow = activity.find((a) => a.day === today);

    // Quiz performance: average of each quiz's LATEST attempt, grouped by document
    const perDoc = new Map();
    let attemptsTotal = 0;
    let percentSum = 0;
    let quizzesAttempted = 0;
    for (const q of quizzes) {
      attemptsTotal += q.attempts.length;
      const latest = q.attempts[q.attempts.length - 1];
      if (!latest || !latest.total || !q.document) continue;
      const pct = Math.round((latest.score / latest.total) * 100);
      quizzesAttempted += 1;
      percentSum += pct;
      const key = String(q.document._id);
      const row = perDoc.get(key) || { documentId: key, name: q.document.fileName, subject: q.document.subject, sum: 0, n: 0 };
      row.sum += pct;
      row.n += 1;
      perDoc.set(key, row);
    }

    const weakDocuments = [...perDoc.values()]
      .map((r) => ({ documentId: r.documentId, name: r.name, subject: r.subject, percent: Math.round(r.sum / r.n) }))
      .filter((r) => r.percent < 75)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3);

    return ok(res, {
      streak,
      week,
      today: { quizzes: todayRow?.quizzes || 0, cards: todayRow?.cards || 0 },
      quizzes: {
        attempts: attemptsTotal,
        averagePercent: quizzesAttempted ? Math.round(percentSum / quizzesAttempted) : null,
      },
      weakDocuments,
      flashcards: { due: dueCards, total: totalCards },
      documents,
      nextExam: req.user.nextExam?.date ? req.user.nextExam : null,
    }, 'Stats fetched');
  } catch (err) {
    logger.error('getStats failed:', err);
    return fail(res, 'Failed to load stats', 500);
  }
}
