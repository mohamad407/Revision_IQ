import rateLimit from 'express-rate-limit';

const json429 = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

// Per-user key (set by requireAuth) so one student can't burn the quota for
// everyone behind the same campus/NAT IP, and so one user can't dodge limits
// by switching IPs.
const byUser = (req) => req.firebaseUser?.uid || 'anonymous';

// Cheap protection for every /api route (per IP; `trust proxy` must be set).
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429('Too many requests. Please slow down.'),
});

// Brute-force / abuse guard on the login-sync endpoint (runs before auth).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429('Too many sign-in attempts. Try again later.'),
});

// Every call here costs Gemini tokens — keep it tight.
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 30,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  handler: json429('AI usage limit reached for this hour. Please try again later.'),
});

// Uploads cost Cloudinary storage + Gemini (summaries / OCR).
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.UPLOAD_RATE_LIMIT_PER_HOUR) || 20,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  handler: json429('Upload limit reached for this hour. Please try again later.'),
});
