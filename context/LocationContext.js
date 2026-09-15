import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import { whenAppReady } from "../utils/appReady";

// Single source of truth for the "Delivery to: ..." label shown in the Home,
// Orders, and Profile headers. Loaded once per session; the screens just read
// `deliveryLocation`. `refreshLocation` re-runs the lookup on demand.
//
// The coordinates and the structured address are published alongside the label
// because checkout needs them in their own right - the address broken into
// lines, and the coordinates to centre the map preview - and re-running the
// lookup there would prompt a second time for the same answer.

const LocationContext = createContext(null);

const FETCHING_LABEL = "Fetching location...";
const FALLBACK_LABEL = "Current location";
const UNAVAILABLE_LABEL = "Location unavailable";

function formatAddress(address) {
  return [address?.name, address?.street, address?.city, address?.region]
    .filter(Boolean)
    .join(", ");
}

export function LocationProvider({ children }) {
  const [deliveryLocation, setDeliveryLocation] = useState(FETCHING_LABEL);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const isFetchingRef = useRef(false);

  const refreshLocation = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    try {
      const coords = await getCurrentLocation();
      setDeliveryCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      const address = await getLocationAddress(
        coords.latitude,
        coords.longitude,
      );
      setDeliveryAddress(address);
      setDeliveryLocation(formatAddress(address) || FALLBACK_LABEL);
    } catch {
      // The coordinates are left as they were: a failed refresh usually means
      // the fix timed out, and the last known position still beats nothing.
      setDeliveryAddress(null);
      setDeliveryLocation(UNAVAILABLE_LABEL);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    // Hold the location permission prompt until the splash has handed off, so
    // it never opens over the branding animation. Resolves instantly after.
    whenAppReady().then(() => {
      if (isActive) {
        refreshLocation();
      }
    });

    return () => {
      isActive = false;
    };
  }, [refreshLocation]);

  const value = useMemo(
    () => ({
      deliveryLocation,
      deliveryAddress,
      deliveryCoords,
      refreshLocation,
    }),
    [deliveryAddress, deliveryCoords, deliveryLocation, refreshLocation],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useDeliveryLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useDeliveryLocation must be used within LocationProvider");
  }

  return context;
}
