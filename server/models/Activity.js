import mongoose from 'mongoose';

// One small document per user per local day. Powers streaks and the weekly chart.
const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true }, // "YYYY-MM-DD" in the student's local time
  quizzes: { type: Number, default: 0 },
  cards: { type: Number, default: 0 },
});

activitySchema.index({ user: 1, day: 1 }, { unique: true });

export default mongoose.model('Activity', activitySchema);
