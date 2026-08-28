import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { httpFetch } from "../utils/httpClient";
import { subscribeNetworkSignals } from "../utils/networkSignals";

export const NO_INTERNET_MESSAGE =
  "No internet connection. Check your connection.";
export const SERVER_UNREACHABLE_MESSAGE =
  "Server is not reachable, try again shortly.";
export const SLOW_CONNECTION_MESSAGE =
  "Slow connection — this may take a while.";

// How many failed/slow fetches in a row before we call the server unreachable
// rather than blaming a single flaky request.
const FAILURES_BEFORE_UNREACHABLE = 2;

// After the user dismisses the banner, this many further failed fetch attempts
// (real requests or recovery probes) bring it back.
const ATTEMPTS_BEFORE_REAPPEAR = 2;

// Wait this long before showing a problem, so a momentary blip never flashes a
// banner. Recovery is applied immediately, with no delay.
const SHOW_DELAY_MS = 2500;

// While degraded, actively re-check on this cadence so the banner clears (and
// the dismiss counter advances) even when the user is idle and firing no
// requests of their own.
const RECOVERY_PROBE_INTERVAL_MS = 8000;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.152:5000/api";
const RECOVERY_PROBE_URL = API_BASE_URL.replace(/\/+$/, "");

const NetworkStatusContext = createContext(null);

function isSlowNetworkType(state) {
  // Android reports the cellular generation; iOS does not. 2g is the only tier
  // slow enough to be worth flagging on its own.
  return (
    state?.type === "cellular" &&
    state?.details?.cellularGeneration === "2g"
  );
}

export function NetworkStatusProvider({ children }) {
  const [netInfo, setNetInfo] = useState({
    isConnected: true,
    isInternetReachable: true,
    isSlowType: false,
  });
  // "ok" | "slow" | "unreachable" - what our own requests are telling us.
  const [serverHealth, setServerHealth] = useState("ok");
  const [dismissed, setDismissed] = useState(false);
  const [debouncedStatus, setDebouncedStatus] = useState("online");

  const consecutiveFailuresRef = useRef(0);
  const attemptsSinceDismissRef = useRef(0);
  const dismissedRef = useRef(false);
  const wasConnectedRef = useRef(true);

  useEffect(() => {
    dismissedRef.current = dismissed;
  }, [dismissed]);

  // Live connectivity - fires immediately with the current state on subscribe.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetInfo({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isSlowType: isSlowNetworkType(state),
      });
    });

    return unsubscribe;
  }, []);

  // Turn request outcomes into a health verdict, and advance the post-dismiss
  // attempt counter.
  useEffect(() => {
    const unsubscribe = subscribeNetworkSignals((signal) => {
      if (dismissedRef.current && signal.type !== "ok") {
        attemptsSinceDismissRef.current += 1;
        if (attemptsSinceDismissRef.current >= ATTEMPTS_BEFORE_REAPPEAR) {
          setDismissed(false);
          attemptsSinceDismissRef.current = 0;
        }
      }

      if (signal.type === "ok") {
        consecutiveFailuresRef.current = 0;
        setServerHealth("ok");
      } else if (signal.type === "slow") {
        consecutiveFailuresRef.current = 0;
        setServerHealth("slow");
      } else {
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= FAILURES_BEFORE_UNREACHABLE) {
          setServerHealth("unreachable");
        }
      }
    });

    return unsubscribe;
  }, []);

  // On the transition from offline back to connected, assume the server is
  // reachable again until a real request proves otherwise - don't strand an
  // "unreachable" banner. Gated on the transition (not every NetInfo emit) so a
  // genuine "internet fine, server down" state doesn't flicker.
  useEffect(() => {
    const isConnected = netInfo.isConnected !== false;
    if (isConnected && !wasConnectedRef.current) {
      consecutiveFailuresRef.current = 0;
      setServerHealth((previous) =>
        previous === "unreachable" ? "ok" : previous,
      );
    }
    wasConnectedRef.current = isConnected;
  }, [netInfo.isConnected]);

  const rawStatus = useMemo(() => {
    if (
      netInfo.isConnected === false ||
      netInfo.isInternetReachable === false
    ) {
      return "offline";
    }
    if (serverHealth === "unreachable") {
      return "unreachable";
    }
    if (serverHealth === "slow" || netInfo.isSlowType) {
      return "slow";
    }
    return "online";
  }, [
    netInfo.isConnected,
    netInfo.isInternetReachable,
    netInfo.isSlowType,
    serverHealth,
  ]);

  // Debounce into the visible status: delay problems, apply recovery at once.
  useEffect(() => {
    if (rawStatus === "online") {
      setDebouncedStatus("online");
      return undefined;
    }

    const timer = setTimeout(() => {
      setDebouncedStatus(rawStatus);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [rawStatus]);

  // Any full recovery resets the dismiss state, so the next outage starts fresh.
  useEffect(() => {
    if (rawStatus === "online") {
      setDismissed(false);
      attemptsSinceDismissRef.current = 0;
    }
  }, [rawStatus]);

  // Active re-check while our own requests are failing/slow or the device is
  // offline - so the banner clears and the post-dismiss counter advances even
  // when the user is on a screen that fires no requests of its own. A merely
  // "slow" network *type* (2g) is left to real traffic, to avoid a permanent
  // background probe loop for the whole time someone is on a slow cell.
  const shouldProbe =
    rawStatus === "offline" ||
    rawStatus === "unreachable" ||
    serverHealth === "slow";

  useEffect(() => {
    if (!shouldProbe) {
      return undefined;
    }

    let cancelled = false;
    const probe = () => {
      if (cancelled) {
        return;
      }
      httpFetch(RECOVERY_PROBE_URL, { method: "HEAD" }).catch(() => {
        // The signal was already reported inside httpFetch.
      });
    };

    const interval = setInterval(probe, RECOVERY_PROBE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [shouldProbe]);

  const message = useMemo(() => {
    switch (debouncedStatus) {
      case "offline":
        return NO_INTERNET_MESSAGE;
      case "unreachable":
        return SERVER_UNREACHABLE_MESSAGE;
      case "slow":
        return SLOW_CONNECTION_MESSAGE;
      default:
        return "";
    }
  }, [debouncedStatus]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    attemptsSinceDismissRef.current = 0;
  }, []);

  const value = useMemo(
    () => ({
      status: debouncedStatus,
      message,
      visible: debouncedStatus !== "online" && !dismissed,
      dismiss,
    }),
    [debouncedStatus, dismiss, dismissed, message],
  );

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);

  if (!context) {
    throw new Error(
      "useNetworkStatus must be used within NetworkStatusProvider",
    );
  }

  return context;
}
