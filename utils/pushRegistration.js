import { AppState } from "react-native";
import { registerPushToken } from "../apis/pushTokenApi";
import { auth } from "./firebase";
import { whenAppReady } from "./appReady";
import {
  PUSH_PERMISSION_DENIED,
  registerForPushNotificationsAsync,
} from "./pushNotifications";

// Registering a push token is a network round trip on a market where
// connectivity drops constantly, and a lost token fails silently and forever —
// the device simply never receives an order update again. So a failed attempt
// is retried with exponential backoff until it lands.
//
// The delay is capped rather than the attempt count: a single small POST every
// few minutes is cheap, and the loop already exits on success, on sign-out, and
// on any failure that another attempt could not fix.

const FIRST_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;

// Bumped on every start/stop so callbacks from an abandoned run — a retry
// scheduled before the user signed out, say — can detect that they are stale
// and do nothing.
let runToken = 0;
let attemptNumber = 0;
let isNewSignupRun = false;
let isRegistered = false;
// runToken of the attempt currently executing, or 0. An attempt can sit for a
// long time on the permission dialog; without this a foreground event would
// kick off a second, concurrent attempt behind it. Holding the token rather
// than a boolean stops an abandoned attempt from clearing the flag belonging
// to the run that replaced it.
let inFlightToken = 0;
let retryTimer = null;
let appStateSub = null;

function clearRetryTimer() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function teardown() {
  clearRetryTimer();
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
}

function logOutcome(outcome, extra) {
  if (!__DEV__) {
    return;
  }
  console.log("[push] registration", outcome, {
    attempt: attemptNumber,
    isNewSignup: isNewSignupRun,
    ...extra,
  });
}

function scheduleRetry(myToken) {
  const delay = Math.min(
    FIRST_RETRY_DELAY_MS * 2 ** (attemptNumber - 1),
    MAX_RETRY_DELAY_MS,
  );

  logOutcome("retry scheduled", { delayMs: delay });

  clearRetryTimer();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    attemptNumber += 1;
    runAttempt(myToken);
  }, delay);
}

async function runAttempt(myToken) {
  if (myToken !== runToken || inFlightToken === runToken) {
    return;
  }

  inFlightToken = myToken;
  try {
    if (!auth.currentUser) {
      // Signed out between attempts — there is nobody to register for.
      teardown();
      return;
    }

    const permission = await registerForPushNotificationsAsync();
    if (myToken !== runToken) {
      return;
    }

    if (!permission.ok) {
      if (permission.reason === PUSH_PERMISSION_DENIED) {
        // No amount of retrying grants permission; only a trip to system
        // settings does. The timer stops, but the foreground listener stays
        // subscribed so returning from Settings picks it straight up.
        logOutcome("stopped: permission denied");
        clearRetryTimer();
        return;
      }

      scheduleRetry(myToken);
      return;
    }

    // Re-read rather than reusing the user captured before the await above:
    // the dialog may have been open for a while, and the uid and the ID token
    // on the request have to come from the same account.
    const user = auth.currentUser;
    if (!user) {
      teardown();
      return;
    }

    const result = await registerPushToken(user, {
      firebase_uid: user.uid,
      ...permission.payload,
    });
    if (myToken !== runToken) {
      return;
    }

    if (result.ok) {
      isRegistered = true;
      logOutcome("succeeded");
      teardown();
      return;
    }

    if (!result.retryable) {
      logOutcome("stopped: request rejected");
      clearRetryTimer();
      return;
    }

    scheduleRetry(myToken);
  } finally {
    // Only clear it if a newer run has not already claimed the slot.
    if (inFlightToken === myToken) {
      inFlightToken = 0;
    }
  }
}

function handleAppStateChange(nextState) {
  if (nextState !== "active" || isRegistered || inFlightToken === runToken) {
    return;
  }

  // Coming back to the foreground is the best free signal we get that
  // connectivity may have returned (and the only way to notice permission
  // being granted in Settings), so skip the remaining backoff and try now.
  clearRetryTimer();
  attemptNumber += 1;
  runAttempt(runToken);
}

export function startPushRegistration({ isNewSignup = false } = {}) {
  runToken += 1;
  const myToken = runToken;

  clearRetryTimer();
  attemptNumber = 1;
  isNewSignupRun = isNewSignup;
  isRegistered = false;

  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", handleAppStateChange);
  }

  // Held until the splash hands off so the permission dialog opens on a real
  // screen rather than over the branding overlay.
  whenAppReady().then(() => runAttempt(myToken));
}

export function stopPushRegistration() {
  runToken += 1;
  isRegistered = false;
  inFlightToken = 0;
  attemptNumber = 0;
  teardown();
}
