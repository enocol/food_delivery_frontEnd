import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as colors from "../utils/colors";

// The app's one page background: the warmCream gradient, stretched to fill its
// parent - responsive full width, flex-1 height. Every content screen wraps its
// body in this so the look is identical everywhere. Screen-specific layout
// (padding, centring) is layered on through `style`.
export default function ScreenGradient({ style, children }) {
  return (
    <LinearGradient
      colors={colors.gradients.warmCream}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: "100%",
  },
});
