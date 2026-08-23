import axios from 'axios';
import { auth } from '../firebase/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
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
  return config;
});

export default api;
