import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    page: { type: String, maxlength: 200, default: '' },
    status: { type: String, enum: ['open', 'done'], default: 'open' },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
