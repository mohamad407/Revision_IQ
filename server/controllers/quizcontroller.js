import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { generateQuiz } from '../services/ai.service.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/quiz/generate  { documentId }
export async function generateQuizForDocument(req, res) {
  try {
    const { documentId } = req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const doc = await Document.findOne({ _id: documentId, user: user._id }).select('+extractedText');
    if (!doc) return fail(res, 'Document not found', 404);
    if (!doc.extractedText) return fail(res, 'Document has no extracted text yet', 400);

    const questions = await generateQuiz(doc.extractedText);

    const quiz = await Quiz.create({
      user: user._id,
      document: doc._id,
      questions,
    });

    // Don't leak correctAnswer to the client before they attempt it.
    const sanitized = {
      _id: quiz._id,
      document: quiz.document,
      questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
    };

    return ok(res, sanitized, 'Quiz generated', 201);
  } catch (err) {
    logger.error('generateQuizForDocument failed:', err);
    return fail(res, 'Failed to generate quiz', 500);
  }
}

// POST /api/quiz/submit  { quizId, answers: [{ questionIndex, selected }] }
export async function submitQuiz(req, res) {
  try {
    const { quizId, answers } = req.body;
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const quiz = await Quiz.findOne({ _id: quizId, user: user._id });
    if (!quiz) return fail(res, 'Quiz not found', 404);

    const gradedAnswers = quiz.questions.map((q, i) => {
      const submitted = answers.find((a) => a.questionIndex === i);
      const selected = submitted?.selected ?? null;
      return {
        questionIndex: i,
        selected,
        correct: selected === q.correctAnswer,
      };
    });

    const score = gradedAnswers.filter((a) => a.correct).length;

    quiz.attempts.push({ answers: gradedAnswers, score, total: quiz.questions.length });
    await quiz.save();

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
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);

    const quizzes = await Quiz.find({ user: user._id })
      .populate('document', 'fileName subject')
      .sort({ createdAt: -1 });

    // Stub-level analytics: just the latest score per quiz, per spec scope.
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
