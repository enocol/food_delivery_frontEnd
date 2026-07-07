import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://192.168.0.152:5000/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const CARTS_ENDPOINT =
  process.env.EXPO_PUBLIC_CARTS_ENDPOINT ||
  `${API_BASE_URL.replace(/\/+$/, "")}/carts`;

const CART_DEBUG_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_DEBUG_CART_API === "true";

function logCartApi(message, meta) {
  if (!CART_DEBUG_ENABLED) {
    return;
  }

  if (meta) {
    console.log(`[cartApi] ${message}`, meta);
    return;
  }

  console.log(`[cartApi] ${message}`);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransientNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("network request failed") ||
    message.includes("fetch failed") ||
    message.includes("etimedout") ||
    message.includes("socket hang up")
  );
}

async function requestJson(
  path,
  { method = "GET", token, body, firebaseUid, retries } = {},
) {
  logCartApi(`${method} ${path}`, {
    hasToken: Boolean(token),
    firebaseUid: firebaseUid || null,
    hasBody: Boolean(body),
  });

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (firebaseUid) {
    headers["X-User-Id"] = firebaseUid;
    headers["X-Firebase-Uid"] = firebaseUid;
  }

  const retryCount =
    typeof retries === "number" ? retries : method === "GET" ? 2 : 0;

  let response;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      response = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (error) {
      if (attempt >= retryCount || !isTransientNetworkError(error)) {
        throw error;
      }

      const backoff = 250 * (attempt + 1);
      logCartApi(`retry ${method} ${path}`, {
        attempt: attempt + 1,
        backoff,
        reason: error?.message || "transient network error",
      });
      await wait(backoff);
    }
  }

  if (!response) {
    throw new Error("Cart request failed before receiving a response.");
  }

  logCartApi(`response ${method} ${path}`, {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    let message = "Cart request failed.";
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      const raw = await response.text().catch(() => "");
      if (raw) {
        message = raw;
      }
    }

    const error = new Error(message);
    error.status = response.status;
    logCartApi(`error ${method} ${path}`, {
      status: response.status,
      message,
    });
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function unwrapCart(payload) {
  if (!payload) {
    return null;
  }

  if (payload.cart && typeof payload.cart === "object") {
    return payload.cart;
  }

  return payload;
}

export async function fetchActiveCart(token, firebaseUid) {
  try {
    const payload = await requestJson(`${CARTS_ENDPOINT}/active`, {
      token,
      firebaseUid,
    });
    return unwrapCart(payload);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createCart(token, firebaseUid) {
  const payload = await requestJson(CARTS_ENDPOINT, {
    method: "POST",
    token,
    firebaseUid,
  });
  return unwrapCart(payload);
}

export async function ensureActiveCart(token, firebaseUid) {
  const activeCart = await fetchActiveCart(token, firebaseUid);
  if (activeCart) {
    return activeCart;
  }
  return createCart(token, firebaseUid);
}

export async function addItemToCart(token, cartId, item, firebaseUid = cartId) {
  const payload = await requestJson(`${CARTS_ENDPOINT}/${cartId}/items`, {
    method: "POST",
    token,
    firebaseUid,
    body: item,
  });
  return unwrapCart(payload);
}

export async function updateCartItemQty(
  token,
  cartId,
  menuItemId,
  qty,
  firebaseUid = cartId,
) {
  const payload = await requestJson(
    `${CARTS_ENDPOINT}/${cartId}/items/${menuItemId}`,
    {
      method: "PATCH",
      token,
      firebaseUid,
      body: { quantity: qty },
    },
  );
  return unwrapCart(payload);
}

export async function removeCartItem(
  token,
  cartId,
  menuItemId,
  firebaseUid = cartId,
) {
  const payload = await requestJson(
    `${CARTS_ENDPOINT}/${cartId}/items/${menuItemId}`,
    {
      method: "DELETE",
      token,
      firebaseUid,
    },
  );
  return unwrapCart(payload);
}

export async function clearCart(token, cartId, firebaseUid = cartId) {
  const payload = await requestJson(`${CARTS_ENDPOINT}/${cartId}`, {
    method: "DELETE",
    token,
    firebaseUid,
  });
  return unwrapCart(payload);
}
