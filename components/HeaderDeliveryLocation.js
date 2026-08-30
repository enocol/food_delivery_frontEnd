import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as colors from "../utils/colors";

// The "Delivery to: <address>" block used as the header-left on the Home,
// Orders, and Profile tabs. Tapping it opens that screen's location modal.
//
// `onLayout` is forwarded to the Pressable so Home can measure the real
// header content height; `style` is layered onto the wrapper for the small
// per-screen offset the transparent-header tabs need.
export default function HeaderDeliveryLocation({
  label,
  onPress,
  onLayout,
  style,
}) {
  return (
    <Pressable onPress={onPress} onLayout={onLayout} style={[styles.wrap, style]}>
      <Text style={styles.label}>Delivery to:</Text>
      <View style={styles.row}>
        <Ionicons name="location" size={25} color={colors.white} />
        <Text style={styles.text} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={25} color={colors.white} />
      </View>
    </Pressable>
  );
}

// Passed to useRootCartHeader as `headerLeftContainerStyle`; react-navigation
// applies it to the wrapper it puts around headerLeft.
export const headerDeliveryLocationContainerStyle = {
  paddingLeft: 16,
  maxWidth: Platform.OS === "ios" ? "80%" : "60%",
};

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: colors.white,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontFamily: "Poppins_800ExtraBold",
    flexShrink: 1,
    fontSize: 14,
    color: colors.white,
  },
});
