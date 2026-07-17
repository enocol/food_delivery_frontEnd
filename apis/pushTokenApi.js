import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://192.168.0.152:5000/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const PUSH_TOKENS_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, "")}/push-tokens`;

export async function registerPushToken(firebaseUser, payload) {
  if (!firebaseUser || !payload?.fcm_token) {
    return false;
  }

  let idToken;
  try {
    idToken = await firebaseUser.getIdToken();
  } catch {
    return false;
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

  try {
    let response = await fetch(PUSH_TOKENS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      const refreshedToken = await firebaseUser.getIdToken(true);
      response = await fetch(PUSH_TOKENS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
        },
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      await response.text();
      return false;
    }

    return true;
  } catch (networkError) {
    return false;
  }
}
