import mongoose from 'mongoose';

export default async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
