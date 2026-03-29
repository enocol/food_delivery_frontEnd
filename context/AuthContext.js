import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../utils/firebase';

const AuthContext = createContext(null);

function mapAuthError(error) {
  if (!error || !error.code) {
    return 'Authentication failed. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Email address is invalid.';
    case 'auth/missing-password':
      return 'Password is required.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'That email is already in use. Try signing in instead.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with those credentials.';
    case 'auth/wrong-password':
      return 'Password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Please wait and try again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email, password) => {
    setAuthActionLoading(true);
    try {
      return await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(mapAuthError(error));
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signUpWithEmail = async (email, password) => {
    setAuthActionLoading(true);
    try {
      return await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(mapAuthError(error));
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthActionLoading(true);
    try {
      await signOut(auth);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      authActionLoading,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
    }),
    [user, authLoading, authActionLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
