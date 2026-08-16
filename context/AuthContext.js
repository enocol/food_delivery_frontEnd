import React, {
  createContext,
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
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { syncUserWithNeon } from "../apis/userApi";
import { registerPushToken } from "../apis/pushTokenApi";
import { connectSocket, disconnectSocket, getSocket } from "../utils/socket";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
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
      setAuthLoading(false);

      if (nextUser) {
        try {
          if (pendingSignupProfileRef.current) {
            await pendingSignupProfileRef.current;
          }
          await ensureCustomerAccountSynced(nextUser);
          connectSocket(() => nextUser.getIdToken());

          // Request permissions and register the push token on login/start.
          registerForPushNotificationsAsync().then(async (pushPayload) => {
            const isNewSignup = newSignupUidRef.current === nextUser.uid;

            if (!pushPayload) {
              if (__DEV__ && isNewSignup) {
                console.log("[push] registration result for new user-----:", {
                  firebase_uid: nextUser.uid,
                  registered: false,
                  reason: "permission_not_granted_or_no_token",
                });
              }
              if (isNewSignup) {
                newSignupUidRef.current = null;
              }
              return;
            }

            const payload = {
              firebase_uid: nextUser.uid,
              ...pushPayload,
            };

            const registered = await registerPushToken(nextUser, payload);

            if (isNewSignup) {
              newSignupUidRef.current = null;
            }
          });
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
      authLoading,
      authActionLoading,
      signInWithEmailPassword,
      createAccountWithEmailPassword,
      resetPassword,
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
