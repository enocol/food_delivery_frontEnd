import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { syncUserWithNeon } from "../apis/userApi";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";
import { AppState } from "react-native";

const AuthContext = createContext(null);

function mapAuthError(error) {
  if (!error || !error.code) {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-phone-number":
      return "Phone number is invalid. Use E.164 format, e.g. +2376XXXXXXXX.";
    case "auth/missing-phone-number":
      return "Phone number is required.";
    case "auth/invalid-verification-code":
      return "The verification code is invalid.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "The verification code expired. Request a new code.";
    case "auth/captcha-check-failed":
      return "App verification failed. Please try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

function formatAuthError(error) {
  const message = mapAuthError(error);
  if (!error?.code) {
    return message;
  }
  return `[${error.code}] ${message}`;
}

function normalizePhoneNumber(phoneNumber) {
  const raw = String(phoneNumber || "").trim();
  if (!raw) {
    return "";
  }

  const compact = raw.replace(/[\s()-]/g, "");
  const withPlus = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;

  if (withPlus.startsWith("+")) {
    return withPlus;
  }

  // Default to Cameroon country code for local numbers.
  const digits = withPlus.replace(/\D/g, "");
  if (digits.length === 9) {
    return `+237${digits}`;
  }

  return withPlus;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);

      if (nextUser) {
        try {
          connectSocket(() => nextUser.getIdToken());
        } catch {
          // Token fetch failed — socket stays disconnected until next auth event.
        }
      } else {
        disconnectSocket();
      }
    });

    return unsubscribe;
  }, []);

  // Reconnect when the app returns to the foreground in case the socket
  // dropped while the app was backgrounded (network change, OS suspension).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const s = getSocket();
      if (s && !s.connected) {
        s.connect();
      }
    });

    return () => subscription.remove();
  }, []);

  const sendPhoneCode = async (phoneNumber, applicationVerifier) => {
    setAuthActionLoading(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        throw new Error("Phone number is required.");
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        applicationVerifier,
      );
      setConfirmationResult(confirmation);
      return confirmation;
    } catch (error) {
      if (error.code) {
        console.warn("[AuthContext] sendPhoneCode failed", {
          code: error.code,
          message: error.message,
        });
        throw new Error(formatAuthError(error));
      }
      throw new Error(
        error.message || "Could not send the code. Please try again.",
      );
    } finally {
      setAuthActionLoading(false);
    }
  };

  const verifyPhoneCode = async (code) => {
    setAuthActionLoading(true);
    try {
      const normalizedCode = String(code || "").trim();
      if (!normalizedCode) {
        throw new Error("Verification code is required.");
      }

      if (!confirmationResult) {
        throw new Error("Request a verification code first.");
      }

      const result = await confirmationResult.confirm(normalizedCode);
      setConfirmationResult(null);

      // Sync the authenticated Firebase user to the Neon users table.
      // Fire-and-forget: a network failure here does not block sign-in.
      syncUserWithNeon(result.user);
      return result;
    } catch (error) {
      if (error.code) {
        console.warn("[AuthContext] verifyPhoneCode failed", {
          code: error.code,
          message: error.message,
        });
        throw new Error(formatAuthError(error));
      }
      throw error;
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthActionLoading(true);
    try {
      disconnectSocket();
      await signOut(auth);
      setConfirmationResult(null);
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
      userPhone: user?.phoneNumber || null, // For convenience, but use with caution as it may not be unique or present.
      authLoading,
      authActionLoading,
      sendPhoneCode,
      verifyPhoneCode,
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
