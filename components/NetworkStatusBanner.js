import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as colors from "../utils/colors";

export default function NetworkStatusBanner({ message, topOffset = 0 }) {
  if (!message) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, { top: topOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <Ionicons name="cloud-offline-outline" size={16} color={colors.white} />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Positioned rather than a real <Modal>: Modal captures the Android
  // hardware back button unless onRequestClose navigates away, which would
  // trap the user on screen for as long as the outage lasts.
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
    elevation: 50,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    maxWidth: "92%",
    backgroundColor: colors.dangerLight,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    flexShrink: 1,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: colors.white,
  },
});
