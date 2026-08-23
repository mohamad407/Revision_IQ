import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[gemini] GEMINI_API_KEY is not set — AI routes will fail.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
});

export default genAI;
