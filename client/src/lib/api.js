import axios from 'axios';
import { auth } from '../firebase/firebase';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Refuse to ship a production build that silently talks to localhost or plain http.
if (import.meta.env.PROD && !/^https:\/\//.test(baseURL)) {
  console.error('VITE_API_BASE_URL must be an https:// URL in production.');
}

const api = axios.create({
  baseURL,
  timeout: 120000, // AI calls can be slow, but never hang forever
});

// Attach the current Firebase ID token to every outgoing request.
// The backend re-verifies this token — it is the only source of truth
// for "who is the user", never a client-supplied id.
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Lets the server roll streaks over at the student's local midnight.
  config.headers['X-TZ-Offset'] = String(new Date().getTimezoneOffset());
  return config;
});

export default api;
