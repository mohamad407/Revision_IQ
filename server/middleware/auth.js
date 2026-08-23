import admin from '../config/firebase.js';
import User from '../models/User.js';
import { fail } from '../utils/response.js';

// Verifies the Firebase ID token on the Authorization header and attaches
// req.firebaseUser (decoded token) + req.user (Mongo user doc, once synced).
// Never trust a client-supplied user id — this is the only source of identity.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return fail(res, 'Missing or invalid Authorization header', 401);
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (user) req.user = user;

    return next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}
