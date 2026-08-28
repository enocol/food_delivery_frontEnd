// A tiny synchronous pub/sub bridge between the HTTP layer and React.
//
// utils/httpClient.js is a plain module with no access to context, so it
// broadcasts the outcome of every request here and NetworkStatusProvider
// subscribes. Keeping this separate from the provider avoids a circular
// import (httpClient -> provider -> httpClient for the recovery probe).

const listeners = new Set();

// signal: { type: "ok" | "slow" | "timeout" | "failure", durationMs: number }
export function reportNetworkSignal(signal) {
  listeners.forEach((listener) => {
    try {
      listener(signal);
    } catch {
      // A broken subscriber must never take down a network request.
    }
  });
}

export function subscribeNetworkSignals(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
