import { io } from "socket.io-client";

// Derive the socket server URL from the same env var used by REST calls.
// EXPO_PUBLIC_API_BASE_URL is e.g. "http://192.168.0.152:5000/api"
// socket.io treats the path segment ("/api") as a namespace, which is correct.
// const SOCKET_URL = (
//   process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.152:5000/api"
// )

const SOCKET_URL = "http://192.168.0.152:5000"

  .replace(/["']/g, "") // strip any accidental quotes from .env
  .replace(/\/+$/, ""); // strip trailing slashes

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
    console.log("[socket] ✅ Connected — id:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] ❌ Disconnected —", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("[socket] ⚠️  Connection error —", err.message);
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
