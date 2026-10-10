import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    photoURL: { type: String },
    university: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    semester: { type: String, trim: true, default: '' },
    // Language for AI-written summaries, quizzes, flashcards and study tools.
    language: {
      type: String,
      enum: ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'],
      default: 'English',
    },
    dailyGoal: { type: Number, min: 1, max: 200, default: 10 }, // flashcards per day
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    disabled: { type: Boolean, default: false },
    nextExam: {
      name: { type: String, trim: true, maxlength: 100 },
      date: { type: Date },
    },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
