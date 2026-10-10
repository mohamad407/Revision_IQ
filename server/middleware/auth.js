import { firebaseAuth } from '../config/firebase.js';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

// Verifies the Firebase ID token on the Authorization header and attaches
// req.firebaseUser (decoded token). Never trust a client-supplied user id —
// this is the only source of identity.
//
// Optional hardening via env:
//   CHECK_REVOKED_TOKENS=true   -> rejects tokens of users whose sessions were revoked
//                                  (one extra Firebase lookup per request)
//   REQUIRE_EMAIL_VERIFIED=true -> blocks password accounts that never verified their email
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      return fail(res, 'Missing or invalid Authorization header', 401);
    }

    const decoded = await firebaseAuth.verifyIdToken(
      token,
      process.env.CHECK_REVOKED_TOKENS === 'true'
    );

    if (process.env.REQUIRE_EMAIL_VERIFIED === 'true' && decoded.email && !decoded.email_verified) {
      return fail(res, 'Please verify your email address to continue', 403);
    }

    req.firebaseUser = decoded;
    return next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}

// Loads the Mongo user ONCE per request so controllers don't each repeat
// the same lookup. Use after requireAuth on every route except /auth/login.
export async function requireUser(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found. Please sign in again.', 404);
    if (user.disabled) return fail(res, 'This account has been disabled.', 403);
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Use after requireAuth + requireUser. The role lives in MongoDB and is only ever
// set by the server (ADMIN_EMAILS), never from anything the client sends.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return fail(res, 'Admin access required', 403);
  return next();
}
