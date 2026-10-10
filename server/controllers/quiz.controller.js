import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import { generateQuiz } from '../services/ai.service.js';
import { logActivity } from '../services/activity.service.js';
import { parseTzOffset } from '../utils/day.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';
import { sendError } from '../utils/errors.js';

// POST /api/quiz/generate  { documentId }
export async function generateQuizForDocument(req, res) {
  try {
    const doc = await Document.findOne({ _id: req.body.documentId, user: req.user._id }).select(
      '+extractedText'
    );
    if (!doc) return fail(res, 'Document not found', 404);
    if (!doc.extractedText) return fail(res, 'Document has no extracted text yet', 400);

    const questions = await generateQuiz(doc.extractedText, {
      count: req.body.count,
      difficulty: req.body.difficulty,
      language: req.user.language,
    });

    const quiz = await Quiz.create({ user: req.user._id, document: doc._id, questions });

    // Don't leak correctAnswer to the client before they attempt it.
    return ok(
      res,
      {
        _id: quiz._id,
        document: quiz.document,
        questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
      },
      'Quiz generated',
      201
    );
  } catch (err) {
    logger.error('generateQuizForDocument failed:', err);
    return sendError(res, err, 'Failed to generate quiz');
  }
}

// POST /api/quiz/submit  { quizId, answers: [{ questionIndex, selected }] }
export async function submitQuiz(req, res) {
  try {
    const { quizId, answers } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, user: req.user._id });
    if (!quiz) return fail(res, 'Quiz not found', 404);

    // First answer per question wins; duplicates / out-of-range indexes are ignored.
    const byIndex = new Map();
    for (const a of answers) {
      if (a.questionIndex < quiz.questions.length && !byIndex.has(a.questionIndex)) {
        byIndex.set(a.questionIndex, a.selected);
      }
    }

    const gradedAnswers = quiz.questions.map((q, i) => {
      const selected = byIndex.get(i) ?? null;
      return { questionIndex: i, selected, correct: selected === q.correctAnswer };
    });

    const score = gradedAnswers.filter((a) => a.correct).length;

    quiz.attempts.push({ answers: gradedAnswers, score, total: quiz.questions.length });
    await quiz.save();
    await logActivity(req.user._id, parseTzOffset(req.headers['x-tz-offset']), { quizzes: 1 });

    return ok(
      res,
      {
        score,
        total: quiz.questions.length,
        answers: gradedAnswers,
        correctAnswers: quiz.questions.map((q) => q.correctAnswer),
      },
      'Quiz submitted'
    );
  } catch (err) {
    logger.error('submitQuiz failed:', err);
    return fail(res, 'Failed to submit quiz', 500);
  }
}

// GET /api/quiz/history
export async function getQuizHistory(req, res) {
  try {
    const quizzes = await Quiz.find({ user: req.user._id })
      .populate('document', 'fileName subject')
      .sort({ createdAt: -1 })
      .limit(200);

    const history = quizzes.map((q) => {
      const latest = q.attempts[q.attempts.length - 1];
      return {
        quizId: q._id,
        document: q.document,
        latestScore: latest ? `${latest.score}/${latest.total}` : null,
        attempts: q.attempts.length,
      };
    });

    return ok(res, history, 'Quiz history fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch quiz history', 500);
  }
}
