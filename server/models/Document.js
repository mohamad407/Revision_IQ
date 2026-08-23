import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    subject: { type: String, trim: true, default: '' },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    pages: { type: Number },
    uploadDate: { type: Date, default: Date.now },
    extractedText: { type: String, select: false }, // large — excluded by default
    summary: {
      type: {
        headline: String,
        keyPoints: [String],
        raw: String,
      },
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
