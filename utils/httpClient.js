import { reportNetworkSignal } from "./networkSignals";

// A request that finishes slower than this still succeeds, but the connection
// is degraded enough that the banner should warn about it.
export const SLOW_REQUEST_MS = 4000;

// Past this the request is aborted and treated as failed, rather than left to
// hang on the OS socket timeout (60s+) - that long hang is what previously made
// a weak signal look like an indefinite shimmer with no explanation.
export const REQUEST_TIMEOUT_MS = 12000;

// Drop-in wrapper around fetch(): same signature and return value, same errors
// bubble out, but every call is timed, timeout-bounded, and reported to
// networkSignals so NetworkStatusProvider can tell online / slow / unreachable
// apart. A 4xx/5xx response still means the server answered, so it counts as
// reachable - only the round-trip time decides ok vs slow.
export async function httpFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const durationMs = Date.now() - startedAt;

    reportNetworkSignal({
      type: durationMs >= SLOW_REQUEST_MS ? "slow" : "ok",
      durationMs,
    });

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const timedOut = controller.signal.aborted;

    reportNetworkSignal({
      type: timedOut ? "timeout" : "failure",
      durationMs,
    });

    if (timedOut) {
      // Keep "network request failed" in the message so callers that sniff for
      // transient network errors (e.g. apis/cartApi.js) still retry a timeout.
      const timeoutError = new Error("Network request failed (request timed out)");
      timeoutError.name = "TimeoutError";
      timeoutError.timedOut = true;
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
