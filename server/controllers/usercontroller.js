import User from '../models/User.js';
import { ok, fail } from '../utils/response.js';

// PUT /api/user/profile
export async function updateProfile(req, res) {
  try {
    const { university, department, semester } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      { $set: { university, department, semester } },
      { new: true, runValidators: true }
    );

    if (!user) return fail(res, 'User not found', 404);
    return ok(res, user, 'Profile updated');
  } catch (err) {
    return fail(res, 'Failed to update profile', 500);
  }
}
