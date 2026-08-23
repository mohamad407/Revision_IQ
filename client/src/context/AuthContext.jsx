import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import api from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // MongoDB-backed profile
  const [loading, setLoading] = useState(true); // resolves once onAuthStateChanged fires once
  const [authError, setAuthError] = useState(null);

  // Sync the Firebase user into our own backend/DB record.
  // Called after signup, login, and on every fresh session restore.
  const syncWithBackend = useCallback(async () => {
    const { data } = await api.post('/auth/login');
    setProfile(data?.data ?? null);
    return data?.data ?? null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await syncWithBackend();
        } catch (err) {
          console.error('Failed to sync user with backend:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [syncWithBackend]);

  const clearError = () => setAuthError(null);

  const signupWithEmail = async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      await syncWithBackend();
      return credential.user;
    } catch (err) {
      setAuthError(mapFirebaseError(err));
      throw err;
    }
  };

  const loginWithEmail = async ({ email, password }) => {
    setAuthError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend();
      return credential.user;
    } catch (err) {
      setAuthError(mapFirebaseError(err));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await syncWithBackend();
      return credential.user;
    } catch (err) {
      setAuthError(mapFirebaseError(err));
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(mapFirebaseError(err));
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const value = {
    firebaseUser,
    profile,
    setProfile,
    loading,
    authError,
    clearError,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    isAuthenticated: !!firebaseUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// Turns Firebase's terse error codes into copy a student would actually understand.
function mapFirebaseError(err) {
  const code = err?.code || '';
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/network-request-failed': 'Network error — check your connection and try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
