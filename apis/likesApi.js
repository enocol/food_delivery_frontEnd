import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://192.168.0.152:5000/api";

// const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
const API_BASE_URL = DEFAULT_API_BASE_URL;

const LIKES_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, "")}/likes`;

/**
 * GET /api/likes/:firebase_uid
 * Returns an array of liked restaurant IDs for the user.
 */
export async function fetchLikes(firebaseUid) {
  const response = await fetch(
    `${LIKES_ENDPOINT}/${encodeURIComponent(firebaseUid)}`,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `[likesApi] GET /likes failed (${response.status}): ${text}`,
    );
  }

  const data = await response.json();
  // Normalise: accept a plain array or a wrapped { likes, data, rows } object.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.likes)) return data.likes;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

/**
 * POST /api/likes
 * Body: { user_id, restaurant_id }
 */
export async function likeRestaurant(firebaseUid, restaurantId) {
  const response = await fetch(LIKES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firebase_uid: firebaseUid,
      restaurant_id: restaurantId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `[likesApi] POST /likes failed (${response.status}): ${text}`,
    );
  }

  return response.json();
}

/**
 * DELETE /api/likes/:firebase_uid/:restaurant_id
 */
export async function unlikeRestaurant(firebaseUid, restaurantId) {
  const response = await fetch(
    `${LIKES_ENDPOINT}/${encodeURIComponent(firebaseUid)}/${encodeURIComponent(restaurantId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `[likesApi] DELETE /likes failed (${response.status}): ${text}`,
    );
  }

  return response.json().catch(() => null); // 204 No Content is fine
}
