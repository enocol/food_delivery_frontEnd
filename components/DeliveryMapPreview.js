import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as colors from "../utils/colors";

// expo-maps resolves its native module at import time, so the import itself
// throws wherever the module is not linked - Expo Go, most notably. Requiring
// it defensively keeps the rest of checkout working there; the preview just
// falls back to the placeholder below.
let Maps = null;
try {
  // eslint-disable-next-line global-require
  Maps = require("expo-maps");
} catch {
  Maps = null;
}

// Close enough to read street names without the marker filling the card.
const ZOOM = 16;

// Android renders through the Google Maps SDK, which throws a fatal
// RuntimeException - not a blank map - when com.google.android.geo.API_KEY is
// missing from the manifest, taking the whole app down with it. expo-maps
// passes straight through to that SDK with no guard of its own, so the check
// has to happen here, before the view is ever mounted.
//
// app.config.js injects the manifest entry from this same variable, so the two
// cannot disagree. Apple Maps needs no key, which is why iOS is exempt.
const HAS_ANDROID_MAPS_KEY = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
);
const CAN_RENDER_MAP =
  Platform.OS === "ios"
    ? true
    : Platform.OS === "android" && HAS_ANDROID_MAPS_KEY;

if (__DEV__ && Platform.OS === "android" && !HAS_ANDROID_MAPS_KEY) {
  console.warn(
    "[DeliveryMapPreview] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set, so the " +
      "map falls back to a placeholder. Rendering it without a key crashes " +
      "the app on Android.",
  );
}

const UI_SETTINGS_APPLE = {
  compassEnabled: false,
  myLocationButtonEnabled: false,
  scaleBarEnabled: false,
  togglePitchEnabled: false,
};

// Google exposes each gesture separately, so a static preview has to switch
// them all off rather than relying on the wrapper's pointerEvents alone.
const UI_SETTINGS_GOOGLE = {
  compassEnabled: false,
  indoorLevelPickerEnabled: false,
  mapToolbarEnabled: false,
  myLocationButtonEnabled: false,
  rotationGesturesEnabled: false,
  scaleBarEnabled: false,
  scrollGesturesEnabled: false,
  scrollGesturesEnabledDuringRotateOrZoom: false,
  tiltGesturesEnabled: false,
  togglePitchEnabled: false,
  zoomControlsEnabled: false,
  zoomGesturesEnabled: false,
};

/**
 * A small, non-interactive map centred on the delivery address. Renders a
 * placeholder instead of the map when the coordinates are not in yet or when
 * the native module is missing.
 */
export default function DeliveryMapPreview({ latitude, longitude, style }) {
  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);

  if (!Maps || !CAN_RENDER_MAP || !hasCoordinates) {
    return (
      <View style={[styles.map, styles.placeholder, style]}>
        <Ionicons name="map-outline" size={22} color={colors.textMuted} />
        <Text style={styles.placeholderText}>
          {hasCoordinates
            ? "Map preview unavailable"
            : "Finding your location..."}
        </Text>
      </View>
    );
  }

  const coordinates = { latitude, longitude };
  const cameraPosition = { coordinates, zoom: ZOOM };
  const markers = [{ id: "delivery", coordinates, title: "Delivery address" }];

  // expo-maps has no unified MapView: the platforms are separate components
  // with separate prop shapes, so this branch is the API rather than a choice.
  const MapView =
    Platform.OS === "ios" ? Maps.AppleMaps.View : Maps.GoogleMaps.View;
  const uiSettings =
    Platform.OS === "ios" ? UI_SETTINGS_APPLE : UI_SETTINGS_GOOGLE;

  return (
    // pointerEvents stops the map from stealing the scroll gesture: the card
    // is something to glance at, not to pan.
    <View style={[styles.map, style]} pointerEvents="none">
      <MapView
        style={StyleSheet.absoluteFill}
        cameraPosition={cameraPosition}
        markers={markers}
        uiSettings={uiSettings}
        properties={{ isTrafficEnabled: false, selectionEnabled: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 132,
    borderRadius: 12,
    // The native map paints to its own bounds, so the rounded corners only
    // hold if the wrapper clips it.
    overflow: "hidden",
    backgroundColor: colors.bgWarmAlt,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
