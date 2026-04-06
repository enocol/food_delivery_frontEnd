import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import * as Crypto from "expo-crypto";
import { auth } from "../utils/firebase";
import {
  generateOtp,
  sendOtpEmail,
  storeOtp,
  verifyOtp,
} from "../utils/otpService";
import { syncUserWithNeon } from "../apis/userApi";

// Salt used to derive a deterministic Firebase credential from an email address.
// This never changes — do not modify after users have been created.
const AUTH_SALT = "mbolo-eats-auth-v1";

const AuthContext = createContext(null);

function mapAuthError(error) {
  if (!error || !error.code) {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "Email address is invalid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

async function deriveFirebaseCredential(email) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    email.toLowerCase().trim() + AUTH_SALT,
  );
}

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

async function authenticateWithFirebase(email) {
  const normalizedEmail = normalizeEmail(email);
  const firebaseCredential = await deriveFirebaseCredential(normalizedEmail);

  let result;
  try {
    result = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      firebaseCredential,
    );
  } catch (signInError) {
    if (
      signInError.code === "auth/user-not-found" ||
      signInError.code === "auth/invalid-credential"
    ) {
      result = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        firebaseCredential,
      );
    } else if (signInError.code === "auth/wrong-password") {
      throw new Error(
        "Could not complete sign-in. Request a new OTP code and try again.",
      );
    } else {
      throw new Error(mapAuthError(signInError));
    }
  }

  // Sync the authenticated Firebase user to the Neon users table.
  // Fire-and-forget: a network failure here does not block sign-in.
  syncUserWithNeon(result.user);

  return result;
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
      const normalizedEmail = normalizeEmail(email);
      const otp = generateOtp();
      await storeOtp(normalizedEmail, otp);
      await sendOtpEmail(normalizedEmail, otp);
    } catch (error) {
      throw new Error(
        error.message || "Could not send the code. Please try again.",
      );
    } finally {
      setAuthActionLoading(false);
    }
  };

  const verifyAndSignIn = async (email, code) => {
    setAuthActionLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      const valid = await verifyOtp(normalizedEmail, code);
      if (!valid) {
        throw new Error(
          "The code is incorrect or has expired. Request a new one.",
        );
      }

      return await authenticateWithFirebase(normalizedEmail);
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

  const getAuthToken = async () => {
    if (!auth.currentUser) {
      return null;
    }
    return auth.currentUser.getIdToken();
  };

  const value = useMemo(
    () => ({
      user,
      firebaseUid: user?.uid || null,
      authLoading,
      authActionLoading,
      sendOtpCode,
      verifyAndSignIn,
      signOutUser,
      getAuthToken,
    }),
    [user, authLoading, authActionLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
