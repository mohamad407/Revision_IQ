import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

// In production (Vercel etc.) store the full service account JSON in
// FIREBASE_SERVICE_ACCOUNT as a single-line env var. Locally you can
// instead point FIREBASE_SERVICE_ACCOUNT_PATH at a downloaded JSON file.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8');
    return JSON.parse(raw);
  }
  throw new Error(
    'Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_PATH.'
  );
}

// firebase-admin v13+ uses the modular API (the old `admin.apps` default import is gone).
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(loadServiceAccount()) });

export const firebaseAuth = getAuth(app);
export default app;
