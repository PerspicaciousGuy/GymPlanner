import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../utils/firebase';

export default function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Failed to read auth state');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  async function login(email, password) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet');
    }
    setError('');
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet');
    }
    setError('');
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!isFirebaseConfigured || !auth) return;
    setError('');
    await signOut(auth);
  }

  function clearError() {
    setError('');
  }

  return useMemo(
    () => ({
      isConfigured: isFirebaseConfigured,
      user,
      loading,
      error,
      login,
      signup,
      logout,
      clearError,
    }),
    [user, loading, error]
  );
}
