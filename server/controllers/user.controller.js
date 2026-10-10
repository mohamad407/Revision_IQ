import User from '../models/User.js';
import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import Predictor from '../models/Predictor.js';
import Flashcard from '../models/Flashcard.js';
import Activity from '../models/Activity.js';
import Share from '../models/Share.js';
import Feedback from '../models/Feedback.js';
import { LANGUAGES } from '../utils/languages.js';
import { firebaseAuth } from '../config/firebase.js';
import { destroyCloudinaryAsset } from '../middleware/upload.js';
import { ok, fail } from '../utils/response.js';
import logger from '../utils/logger.js';

// PUT /api/user/profile  — explicit allow-list, nothing else can be written.
export async function updateProfile(req, res) {
  try {
    const update = {};
    for (const key of ['university', 'department', 'semester']) {
      if (typeof req.body[key] === 'string') update[key] = req.body[key];
    }

    if (LANGUAGES.includes(req.body.language)) update.language = req.body.language;
    const goal = parseInt(req.body.dailyGoal, 10);
    if (Number.isInteger(goal) && goal >= 1 && goal <= 200) update.dailyGoal = goal;

    const op = { $set: update };
    if (req.body.nextExam === null) {
      op.$unset = { nextExam: '' }; // clear the countdown
    } else if (req.body.nextExam && req.body.nextExam.date) {
      update.nextExam = {
        name: String(req.body.nextExam.name || 'Exam').slice(0, 100),
        date: new Date(req.body.nextExam.date),
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, op, {
      new: true,
      runValidators: true,
    });
    return ok(res, user, 'Profile updated');
  } catch (err) {
    logger.error('updateProfile failed:', err);
    return fail(res, 'Failed to update profile', 500);
  }
}

// DELETE /api/user/me  — right-to-erasure: removes every file, record and the login itself.
export async function deleteAccount(req, res) {
  try {
    const userId = req.user._id;

    const [docs, predictors] = await Promise.all([
      Document.find({ user: userId }).select('cloudinaryPublicId cloudinaryType'),
      Predictor.find({ user: userId }),
    ]);

    await Promise.all([
      ...docs.map((d) =>
        destroyCloudinaryAsset({ publicId: d.cloudinaryPublicId, mimeType: 'application/pdf', type: d.cloudinaryType })
      ),
      ...predictors.flatMap((p) =>
        p.pastPapers.map((paper) =>
          destroyCloudinaryAsset({
            publicId: paper.cloudinaryPublicId,
            mimeType: paper.mimeType,
            type: paper.cloudinaryType,
          })
        )
      ),
    ]);

    await Promise.all([
      Quiz.deleteMany({ user: userId }),
      Flashcard.deleteMany({ user: userId }),
      Activity.deleteMany({ user: userId }),
      Share.deleteMany({ owner: userId }),
      Feedback.deleteMany({ user: userId }),
      Document.deleteMany({ user: userId }),
      Predictor.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });
    await firebaseAuth.deleteUser(req.firebaseUser.uid).catch(() => {});

    return ok(res, null, 'Account and all data deleted');
  } catch (err) {
    logger.error('deleteAccount failed:', err);
    return fail(res, 'Failed to delete account', 500);
  }
}
