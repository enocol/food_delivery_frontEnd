import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { syncUserWithNeon } from "../apis/userApi";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";
import { AppState } from "react-native";

const AuthContext = createContext(null);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mapAuthError(error) {
  if (!error || !error.code) {
    return "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "The email address is invalid.";
    case "auth/missing-password":
      return "Password is required.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/email-already-in-use":
      return "This email already has an account. Try signing in with your password.";
    case "auth/user-not-found":
      return "No account was found for that email. A new account will be created when you sign in.";
    case "auth/wrong-password":
      return "The password is incorrect.";
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  const ensureCustomerAccountSynced = async (firebaseUser) => {
    // Retry once in case backend upsert races with fresh token propagation.
    const firstAttempt = await syncUserWithNeon(firebaseUser);
    if (firstAttempt) {
      return true;
    }

    await wait(600);
    return syncUserWithNeon(firebaseUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);

      if (nextUser) {
        try {
          await ensureCustomerAccountSynced(nextUser);
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

  const signInWithEmailPassword = async (email, password) => {
    setAuthActionLoading(true);
    try {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      const normalizedPassword = String(password || "");

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }

      if (!normalizedPassword) {
        throw new Error("Password is required.");
      }

      let result;
      try {
        result = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          normalizedPassword,
        );
      } catch (error) {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }

        result = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          normalizedPassword,
        );
      }

      // Sync the authenticated Firebase user to the Neon users table.
      // Fire-and-forget: a network failure here does not block sign-in.
      syncUserWithNeon(result.user);
      return result;
    } catch (error) {
      if (error.code) {
        if (__DEV__) {
          console.warn("[AuthContext] signInWithEmailPassword failed", {
            code: error.code,
            message: error.message,
          });
        }
        throw new Error(formatAuthError(error));
      }
      throw new Error(error.message || "Could not sign in. Please try again.");
    } finally {
      setAuthActionLoading(false);
    }
  };

  const createAccountWithEmailPassword = async (name, email, password) => {
    setAuthActionLoading(true);
    try {
      const normalizedName = String(name || "").trim();
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      const normalizedPassword = String(password || "");

      if (!normalizedName) {
        throw new Error("Name is required.");
      }

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }

      if (!normalizedPassword) {
        throw new Error("Password is required.");
      }

      const result = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword,
      );

      await updateProfile(result.user, {
        displayName: normalizedName,
      });

      // Sync the authenticated Firebase user to the Neon users table.
      // Fire-and-forget: a network failure here does not block sign-in.
      syncUserWithNeon(result.user);
      return result;
    } catch (error) {
      if (error.code) {
        if (__DEV__) {
          console.warn("[AuthContext] createAccountWithEmailPassword failed", {
            code: error.code,
            message: error.message,
          });
        }
        throw new Error(formatAuthError(error));
      }
      throw new Error(
        error.message || "Could not create the account. Please try again.",
      );
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthActionLoading(true);
    try {
      disconnectSocket();
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
      userPhone: user?.phoneNumber || null,
      userEmail: user?.email || null,
      authLoading,
      authActionLoading,
      signInWithEmailPassword,
      createAccountWithEmailPassword,
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
