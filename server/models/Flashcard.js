import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    front: { type: String, required: true, maxlength: 600 },
    back: { type: String, required: true, maxlength: 1500 },
    // Spaced-repetition state
    ease: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 }, // days
    repetitions: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: Date.now },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

flashcardSchema.index({ user: 1, dueAt: 1 });
flashcardSchema.index({ user: 1, document: 1 });

export default mongoose.model('Flashcard', flashcardSchema);
