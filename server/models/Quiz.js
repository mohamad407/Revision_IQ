import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      validate: (arr) => arr.length === 4,
      required: true,
    },
    correctAnswer: { type: String, required: true }, // must match one of `options`
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    answers: [{ questionIndex: Number, selected: String, correct: Boolean }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    questions: { type: [questionSchema], required: true },
    attempts: { type: [attemptSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
