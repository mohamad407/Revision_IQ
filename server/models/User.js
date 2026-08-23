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
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
