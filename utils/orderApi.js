import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://192.168.0.152:5000/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const ORDERS_ENDPOINT =
  process.env.EXPO_PUBLIC_ORDERS_ENDPOINT ||
  `${API_BASE_URL.replace(/\/+$/, "")}/orders`;

const ORDER_DEBUG_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_DEBUG_ORDER_API === "true";

function logOrderApi(message, meta) {
  if (!ORDER_DEBUG_ENABLED) {
    return;
  }

  if (meta) {
    console.log(`[orderApi] ${message}`, meta);
    return;
  }

  console.log(`[orderApi] ${message}`);
}

async function requestJson(
  path,
  { method = "GET", token, body, firebaseUid } = {},
) {
  logOrderApi(`${method} ${path}`, {
    hasToken: Boolean(token),
    firebaseUid: firebaseUid || null,
    hasBody: Boolean(body),
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (firebaseUid) {
    headers["X-Firebase-Uid"] = firebaseUid;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);
  const data = await response.json();

  logOrderApi(`${method} ${path} -> ${response.status}`, {
    statusOk: response.ok,
    dataKeys: data ? Object.keys(data) : null,
  });

  if (!response.ok) {
    const error = new Error(
      data?.message || `HTTP ${response.status}: ${response.statusText}`,
    );
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

function unwrapOrder(payload) {
  if (payload?.order) {
    return payload.order;
  }
  return payload;
}

export async function createOrder(token, firebaseUid, orderPayload) {
  const response = await requestJson(ORDERS_ENDPOINT, {
    method: "POST",
    token,
    firebaseUid,
    body: orderPayload,
  });
  return unwrapOrder(response);
}
