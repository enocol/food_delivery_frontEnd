import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://localhost:5000/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const USERS_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, "")}/auth`;

/**
 * Called after every successful Firebase sign-in or sign-up.
 * Sends the Firebase ID token to the backend, which verifies it and upserts
 * the authenticated user in the Neon `users` table using firebase_uid as PK.
 *
 * Backend contract (POST /api/users/sync):
 *   Headers: { Authorization: "Bearer <firebase_id_token>" }
 *   Action:  INSERT INTO users (firebase_uid, email, created_at, updated_at)
 *            VALUES ($1, $2, now(), now())
 *            ON CONFLICT (firebase_uid)
 *            DO UPDATE SET email = EXCLUDED.email, updated_at = now()
 *            RETURNING *;
 */
export async function syncUserWithNeon(firebaseUser) {
  if (!firebaseUser) return;

  let idToken;
  try {
    idToken = await firebaseUser.getIdToken();
  } catch {
    // If token retrieval fails, skip silently — user is still signed in to Firebase.
    return;
  }

  try {
    const response = await fetch(`${USERS_ENDPOINT}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(
        `[userApi] syncUserWithNeon failed (${response.status}): ${text}`,
      );
    }
  } catch (networkError) {
    // Network failure should not block the user from using the app.
    console.warn(
      "[userApi] syncUserWithNeon network error:",
      networkError.message,
    );
  }
}