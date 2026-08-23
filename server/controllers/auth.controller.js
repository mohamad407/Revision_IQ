import User from '../models/User.js';
import { ok, fail } from '../utils/response.js';

// POST /api/auth/login
// Called by the frontend right after Firebase signup/login/session-restore.
// Creates the user on first sight, otherwise just bumps lastLogin.
export async function loginOrSync(req, res) {
  try {
    const { uid, email, name, picture } = req.firebaseUser;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email || '',
        name: name || '',
        photoURL: picture || '',
      });
    } else {
      user.lastLogin = new Date();
      // Keep name/photo fresh in case they changed on the Firebase side
      // (e.g. a Google account's display name or avatar).
      if (name) user.name = name;
      if (picture) user.photoURL = picture;
      await user.save();
    }

    return ok(res, user, 'Signed in');
  } catch (err) {
    return fail(res, 'Failed to sync user', 500);
  }
}

// GET /api/auth/profile
export async function getAuthProfile(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return fail(res, 'User not found', 404);
    return ok(res, user, 'Profile fetched');
  } catch (err) {
    return fail(res, 'Failed to fetch profile', 500);
  }
}
