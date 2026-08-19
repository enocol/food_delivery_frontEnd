import { io } from "socket.io-client";

// Derive the socket server URL from the same env var the REST calls use, so
// pointing at a new backend only means editing .env.
//
// EXPO_PUBLIC_API_BASE_URL carries an "/api" suffix for REST, but socket.io
// reads a trailing path segment as a NAMESPACE rather than a path. Passing the
// URL verbatim would try to join namespace "/api", which this server does not
// serve — verified against the deployment: /socket.io/ handshakes, while
// /api/socket.io/ returns 404. So strip it and connect to the origin.
const SOCKET_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.152:5000/api"
)
  .replace(/["']/g, "") // strip any accidental quotes from .env
  .trim() // .env has whitespace around the "="
  .replace(/\/+$/, "") // strip trailing slashes
  .replace(/\/api$/, ""); // REST-only path segment, not a socket namespace

/** @type {import("socket.io-client").Socket | null} */
let socket = null;

/**
 * Create (or recreate) the socket connection authenticated with a Firebase
 * ID token.  Any existing connection is cleanly disconnected first so the
 * server always gets a fresh room assignment.
 *
 * @param {() => Promise<string>} getTokenFn  Async function that returns a fresh Firebase ID token
 * @returns {import("socket.io-client").Socket}
 */
export function connectSocket(getTokenFn) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    // Dynamic callback so every reconnect attempt gets a fresh Firebase token.
    // getIdToken() auto-refreshes the token when it is near expiry.
    auth: (cb) => {
      getTokenFn()
        .then((token) => cb({ token, role: "customer" }))
        .catch(() => cb({ token: "", role: "customer" }));
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity, // never give up
    reconnectionDelay: 2000, // start at 2 s
    reconnectionDelayMax: 30000, // cap backoff at 30 s
    randomizationFactor: 0.5, // jitter so clients don't all retry at once
  });
  //   console.log("[socket] Attempting connection to", SOCKET_URL);
  socket.on("connect", () => {
    if (__DEV__) {
      console.log("[socket] ✅ Connected — id:", socket.id);
    }
  });

  socket.on("disconnect", (reason) => {
    if (__DEV__) {
      console.log("[socket] ❌ Disconnected —", reason);
    }
  });

  socket.on("connect_error", (err) => {
    if (__DEV__) {
      console.log("[socket] ⚠️  Connection error —", err.message);
    }
  });

  return socket;
}

/**
 * Disconnect and discard the current socket.  Safe to call even if no socket
 * is active.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Return the current socket instance, or null if not connected.
 *
 * @returns {import("socket.io-client").Socket | null}
 */
export function getSocket() {
  return socket;
}
