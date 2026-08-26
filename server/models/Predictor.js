import mongoose from 'mongoose';

const patternStageSchema = new mongoose.Schema(
  {
    // e.g. CAT-1 covers modules 1-2, 2 questions worth 10 marks each, essay-type.
    numQuestions: { type: Number, default: 0 },
    marksPerQuestion: { type: Number, default: 0 },
    questionType: { type: String, trim: true, default: '' }, // e.g. "MCQ", "Essay", "Numerical"
    topics: { type: String, trim: true, default: '' }, // free text: modules/units covered
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const pastPaperSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' }, // pdf or image/*
    stage: { type: String, enum: ['cat1', 'cat2', 'fat', 'unspecified'], default: 'unspecified' },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    extractedText: { type: String, select: false },
  },
  { timestamps: true }
);

const predictedQuestionSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    question: { type: String, required: true },
    likelihood: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    reasoning: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const paperQuestionSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    question: { type: String, required: true },
    marks: { type: Number, default: 0 },
  },
  { _id: false }
);

const importantTopicSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    summary: { type: String, trim: true, default: '' },
    modelAnswer: { type: String, required: true },
  },
  { _id: false }
);

const predictorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    syllabusText: { type: String, trim: true, default: '' },

    pattern: {
      cat1: { type: patternStageSchema, default: () => ({}) },
      cat2: { type: patternStageSchema, default: () => ({}) },
      fat: { type: patternStageSchema, default: () => ({}) },
    },

    pastPapers: { type: [pastPaperSchema], default: [] },

    predictions: {
      cat1: { type: [predictedQuestionSchema], default: [] },
      cat2: { type: [predictedQuestionSchema], default: [] },
      fat: { type: [predictedQuestionSchema], default: [] },
    },

    modelPaper: {
      cat1: { type: [paperQuestionSchema], default: [] },
      cat2: { type: [paperQuestionSchema], default: [] },
      fat: { type: [paperQuestionSchema], default: [] },
    },

    importantTopics: { type: [importantTopicSchema], default: [] },

    status: {
      type: String,
      enum: ['draft', 'predicting', 'ready', 'failed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Predictor', predictorSchema);
