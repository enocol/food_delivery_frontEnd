import { useCallback, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export const NO_INTERNET_MESSAGE = "No internet connection. Check your connection.";
export const SERVER_UNREACHABLE_MESSAGE =
  "Server is not reachable, try again shortly.";

// Callers only need this after their own request has already failed, so it
// checks on demand rather than keeping a live subscription running.
export default function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(null);
  const [isInternetReachable, setIsInternetReachable] = useState(null);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable);

    const isOffline =
      state.isConnected === false || state.isInternetReachable === false;

    return isOffline ? NO_INTERNET_MESSAGE : SERVER_UNREACHABLE_MESSAGE;
  }, []);

  return { isConnected, isInternetReachable, checkConnection };
}
