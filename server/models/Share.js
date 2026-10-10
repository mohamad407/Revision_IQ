import mongoose from 'mongoose';

// A snapshot of a flashcard deck that anyone with the link can preview and copy.
const shareSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: { type: String, required: true, maxlength: 200 },
    cards: [{ _id: false, front: { type: String, maxlength: 600 }, back: { type: String, maxlength: 1500 } }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB removes expired shares automatically.
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Share', shareSchema);
