import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import documentRoutes from './routes/document.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import predictorRoutes from './routes/predictor.routes.js';
import flashcardRoutes from './routes/flashcard.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { errorHandler } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimit.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Render / Vercel sit behind one reverse proxy. Without this, req.ip is the
// proxy's IP, so every user shares one rate-limit bucket (and IP spoofing via
// X-Forwarded-For becomes possible if set too loosely).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS: allow-list only. If CLIENT_ORIGIN is missing we allow just the local
// dev server — never "reflect any origin" (the old behaviour with credentials).
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
if (!allowedOrigins.length && !isProd) allowedOrigins.push('http://localhost:5173');

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = non-browser client (curl, health checks): allowed, still needs a token.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-TZ-Offset'],
    maxAge: 600,
  })
);
app.use(helmet());
app.use(compression());
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '200kb' }));

app.use('/api', globalLimiter);

app.get('/', (req, res) => res.json({ success: true, message: 'Welcome to the RevisionIQ API!' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/predictor', predictorRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
