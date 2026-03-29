import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import * as Crypto from 'expo-crypto';
import { auth } from '../utils/firebase';
import { generateOtp, sendOtpEmail, storeOtp, verifyOtp } from '../utils/otpService';

// Salt used to derive a deterministic Firebase password from an email address.
// This never changes — do not modify after users have been created.
const AUTH_SALT = 'mbolo-eats-auth-v1';

const AuthContext = createContext(null);

function mapAuthError(error) {
  if (!error || !error.code) {
    return 'Authentication failed. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Email address is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

async function deriveFirebasePassword(email) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    email.toLowerCase().trim() + AUTH_SALT
  );
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

  const sendOtpCode = async (email) => {
    setAuthActionLoading(true);
    try {
      const otp = generateOtp();
      await storeOtp(email.trim(), otp);
      await sendOtpEmail(email.trim(), otp);
    } catch (error) {
      throw new Error(error.message || 'Could not send the code. Please try again.');
    } finally {
      setAuthActionLoading(false);
    }
  };

  const verifyAndSignIn = async (email, code) => {
    setAuthActionLoading(true);
    try {
      const valid = await verifyOtp(email.trim(), code);
      if (!valid) {
        throw new Error('The code is incorrect or has expired. Request a new one.');
      }

      const password = await deriveFirebasePassword(email);

      try {
        return await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (signInError) {
        if (
          signInError.code === 'auth/user-not-found' ||
          signInError.code === 'auth/invalid-credential'
        ) {
          return await createUserWithEmailAndPassword(auth, email.trim(), password);
        }
        if (signInError.code === 'auth/wrong-password') {
          throw new Error(
            'This email is linked to another device. Please sign in on your original device or contact support.'
          );
        }
        throw new Error(mapAuthError(signInError));
      }
    } catch (error) {
      if (error.code) {
        throw new Error(mapAuthError(error));
      }
      throw error;
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
      sendOtpCode,
      verifyAndSignIn,
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
