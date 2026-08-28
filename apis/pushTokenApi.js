import { Platform } from "react-native";
import { httpFetch } from "../utils/httpClient";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://192.168.0.152:5000/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const PUSH_TOKENS_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, "")}/push-tokens`;

// Retryable statuses: the server is unreachable, overloaded, or asking us to
// back off. Any other 4xx means this payload will be rejected just as hard
// next time, so retrying it only burns battery.
function isRetryableStatus(status) {
  return status >= 500 || status === 408 || status === 429;
}

// Returns { ok, retryable } so the caller can decide whether another attempt
// could plausibly succeed.
export async function registerPushToken(firebaseUser, payload) {
  if (!firebaseUser || !payload?.fcm_token) {
    return { ok: false, retryable: false };
  }

  let idToken;
  try {
    idToken = await firebaseUser.getIdToken();
  } catch {
    // Minting an ID token can hit the network, so this is worth another go.
    return { ok: false, retryable: true };
  }

  const requestBody = {
    firebase_uid: payload.firebase_uid,
    token: payload.fcm_token,
    platform: payload.platform,
    device_id: payload.device_id,
    app_version: payload.app_version,
    locale: payload.locale,
    is_active: payload.is_active,
  };

  if (__DEV__) {
    console.log("[push] backend registration payload:", requestBody);
  }

  try {
    let response = await httpFetch(PUSH_TOKENS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      const refreshedToken = await firebaseUser.getIdToken(true);
      response = await httpFetch(PUSH_TOKENS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const body = await response.text();
      if (__DEV__) {
        console.warn(
          `[push] backend rejected token (${response.status}):`,
          body,
        );
      }
      return { ok: false, retryable: isRetryableStatus(response.status) };
    }

    return { ok: true };
  } catch (networkError) {
    // fetch only rejects on a genuine network failure, which is exactly the
    // case we want to keep retrying.
    return { ok: false, retryable: true };
  }
}
