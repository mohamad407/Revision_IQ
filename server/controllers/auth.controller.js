import User from '../models/User.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// POST /api/auth/login
// Called by the frontend right after Firebase signup/login/session-restore.
// Uses an atomic upsert: the frontend fires this twice on signup (once from
// onAuthStateChanged, once explicitly), and a find-then-create would race and
// hit the unique index on firebaseUid.
export async function loginOrSync(req, res) {
  try {
    const { uid, email, name, picture } = req.firebaseUser;

    const set = { lastLogin: new Date() };
    if (name) set.name = name;
    if (picture) set.photoURL = picture;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: set,
        $setOnInsert: { firebaseUid: uid, email: (email || '').toLowerCase() },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return ok(res, user, 'Signed in');
  } catch (err) {
    logger.error('loginOrSync failed:', err);
    return fail(res, 'Failed to sync user', 500);
  }
}

// GET /api/auth/profile
export async function getAuthProfile(req, res) {
  return ok(res, req.user, 'Profile fetched');
}
