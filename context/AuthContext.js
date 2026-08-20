import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { syncUserWithNeon } from "../apis/userApi";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";
import {
  startPushRegistration,
  stopPushRegistration,
} from "../utils/pushRegistration";
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
      return "No account was found for that email.";
    case "auth/wrong-password":
      return "The password is incorrect.";
    case "auth/invalid-credential":
      return "Incorrect email or password.";
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
  if (!__DEV__ || !error?.code) {
    return message;
  }
  return `[${error.code}] ${message}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Mirrors user.emailVerified, but as state so screens re-render when it
  // flips. The flag on the user object is read from the cached ID token and
  // does not update on its own when the user clicks the link in their inbox.
  const [emailVerified, setEmailVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const newSignupUidRef = useRef(null);
  // Set while createAccountWithEmailPassword is applying the display name,
  // so the sync below can wait for it instead of syncing a nameless user.
  const pendingSignupProfileRef = useRef(null);

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
      setEmailVerified(Boolean(nextUser?.emailVerified));
      setAuthLoading(false);

      if (nextUser) {
        try {
          if (pendingSignupProfileRef.current) {
            await pendingSignupProfileRef.current;
          }

          // A restored session carries whatever the last token said, which is
          // stale if the user verified elsewhere or while the app was closed.
          try {
            await nextUser.reload();
            setEmailVerified(Boolean(auth.currentUser?.emailVerified));
          } catch {
            // Offline: keep the cached value and re-check on next foreground.
          }

          await ensureCustomerAccountSynced(nextUser);
          connectSocket(() => nextUser.getIdToken());

          newSignupUidRef.current = null;
          // Push registration is deliberately NOT started here — it waits for
          // the account to be verified. See the effect below.
        } catch {
          // Token fetch failed — socket stays disconnected until next auth event.
        }
      } else {
        disconnectSocket();
        stopPushRegistration();
      }
    });

    return unsubscribe;
  }, []);

  // Firebase never re-fires onAuthStateChanged when an email is verified, so
  // the only way to notice is to reload the user and look again. Called at
  // startup, whenever the app is foregrounded, and from the verify screen.
  const refreshVerification = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    try {
      await currentUser.reload();
    } catch {
      // Offline — keep whatever we already believed.
      return emailVerified;
    }

    const nowVerified = Boolean(auth.currentUser?.emailVerified);

    if (nowVerified && !emailVerified) {
      // Just verified. The ID token is a snapshot, so the backend would keep
      // seeing email_verified: false for up to an hour unless we force a fresh
      // one — the same reason the display name is refreshed after signup.
      try {
        await auth.currentUser.getIdToken(true);
        await ensureCustomerAccountSynced(auth.currentUser);
      } catch {
        // The forced refresh is best effort; the next request picks it up.
      }
    }

    setEmailVerified(nowVerified);
    return nowVerified;
  }, [emailVerified]);

  const resendVerificationEmail = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You need to be signed in to resend the email.");
    }

    try {
      await sendEmailVerification(currentUser);
    } catch (error) {
      if (error?.code === "auth/too-many-requests") {
        throw new Error(
          "Too many requests. Wait a few minutes before trying again.",
        );
      }
      throw new Error(formatAuthError(error));
    }
  }, []);

  // Push registration waits for a verified account. Notification permission is
  // a one-shot resource — on Android 13+ two dismissals is a permanent denial —
  // so it is spent at the point the user has proven the address, not on the
  // signup screen. Keyed on both facts because verifying does not re-fire the
  // auth listener.
  useEffect(() => {
    if (!user || !emailVerified) {
      return;
    }
    startPushRegistration();
  }, [user, emailVerified]);

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

      // The user may have just come back from their mail app having clicked
      // the link. Nothing else would tell us.
      void refreshVerification();
    });

    return () => subscription.remove();
  }, [refreshVerification]);

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

      // No profile mutation happens on sign-in, so the sync triggered by
      // onAuthStateChanged is sufficient — no need to sync again here.
      const result = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword,
      );

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
    let resolvePendingSignupProfile;
    pendingSignupProfileRef.current = new Promise((resolve) => {
      resolvePendingSignupProfile = resolve;
    });
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

      newSignupUidRef.current = result.user.uid;

      await updateProfile(result.user, {
        displayName: normalizedName,
      });

      // Force a token refresh so the cached ID token reflects the display
      // name just set above — the sync that onAuthStateChanged is waiting
      // to run (see pendingSignupProfileRef) picks up this refreshed token.
      await result.user.getIdToken(true);

      try {
        await sendEmailVerification(result.user);
      } catch (verificationError) {
        // The account exists at this point, so a failed send must not fail the
        // signup. The verify screen offers a resend.
        if (__DEV__) {
          console.warn(
            "[AuthContext] verification email failed to send",
            verificationError?.code || verificationError?.message,
          );
        }
      }

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
      resolvePendingSignupProfile();
      pendingSignupProfileRef.current = null;
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

  const resetPassword = async (email) => {
    setAuthActionLoading(true);
    try {
      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }

      await sendPasswordResetEmail(auth, normalizedEmail);
    } catch (error) {
      if (error.code) {
        if (__DEV__) {
          console.warn("[AuthContext] resetPassword failed", {
            code: error.code,
            message: error.message,
          });
        }
        throw new Error(formatAuthError(error));
      }
      throw new Error(
        error.message || "Could not send the reset email. Please try again.",
      );
    } finally {
      setAuthActionLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      firebaseUid: user?.uid || null,
      userPhone: user?.phoneNumber || null,
      userEmail: user?.email || null,
      emailVerified,
      authLoading,
      authActionLoading,
      signInWithEmailPassword,
      createAccountWithEmailPassword,
      resetPassword,
      signOutUser,
      getAuthToken,
      refreshVerification,
      resendVerificationEmail,
    }),
    [
      user,
      emailVerified,
      authLoading,
      authActionLoading,
      refreshVerification,
      resendVerificationEmail,
    ],
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
