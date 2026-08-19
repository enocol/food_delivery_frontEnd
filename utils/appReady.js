// One-shot signal for "the splash has handed off and a real screen is
// visible". Anything that puts OS UI in front of the user — currently the
// notification permission dialog — waits on this so the prompt doesn't land
// on top of the branding overlay.
//
// A module-level promise rather than context: the only consumer waits inside
// an already-async callback (the Firebase auth listener), so it needs a value
// to await, not a re-render.

// Generous upper bound on the splash: ~3s of animation plus slack.
const READY_TIMEOUT_MS = 8000;

let isReady = false;
let fallbackTimer = null;
let resolveReady;

const readyPromise = new Promise((resolve) => {
  resolveReady = resolve;
});

export function markAppReady() {
  if (isReady) {
    return;
  }

  isReady = true;

  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  resolveReady();
}

// Resolves once the splash is done — immediately for every call after that,
// so re-authenticating later in the session never waits.
export function whenAppReady() {
  if (isReady) {
    return Promise.resolve();
  }

  // Safety net armed on first use: if the splash never reports in, waiters
  // must not block forever or push registration would silently never run.
  if (!fallbackTimer) {
    fallbackTimer = setTimeout(markAppReady, READY_TIMEOUT_MS);
  }

  return readyPromise;
}
