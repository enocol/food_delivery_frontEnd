// Where to send someone after a successful sign-in, when signing in was
// triggered by an action that needs an account rather than by them choosing to
// sign in. Someone interrupted mid-checkout must land back on checkout, not on
// the home tab.
//
// A module-level value rather than a route param because the redirect itself is
// centralised in app/_layout.js — it fires from an auth-state effect that has no
// access to whatever screen queued the request.

let pendingPath = null;

export function setPostAuthRedirect(path) {
  pendingPath = path || null;
}

// Read-and-clear: a queued redirect is used exactly once, so a later unrelated
// sign-in never bounces the user somewhere unexpected.
export function consumePostAuthRedirect() {
  const path = pendingPath;
  pendingPath = null;
  return path;
}

// For sign-in entry points that are deliberate rather than interrupted — the
// buttons on Profile and Orders — so a stale queued path cannot hijack them.
export function clearPostAuthRedirect() {
  pendingPath = null;
}
