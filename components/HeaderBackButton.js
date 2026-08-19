import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import * as colors from "../utils/colors";

// One back control for both platforms. The native one differs by design —
// iOS draws a chevron (plus the previous screen's title unless suppressed),
// Android draws a bare Material arrow — so rendering our own is the only way
// to make them identical. `arrow-back` from MaterialIcons is the exact glyph
// Android uses natively, and that font is already in the bundle.
//
// Pass as `headerLeft`; native-stack supplies `tintColor` from the screen's
// headerTintColor, so the icon follows whatever each header already sets.
export default function HeaderBackButton({ tintColor, color }) {
  const navigation = useNavigation();
  const iconColor = color || tintColor || colors.black;

  // A root screen has nothing to go back to; drawing a dead control there
  // would be worse than drawing nothing.
  if (!navigation.canGoBack()) {
    return null;
  }

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <MaterialIcons name="arrow-back" size={24} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // 40x40 keeps the tap target at the accessibility minimum even though the
    // glyph is 24, and centres it the way the native control is centred.
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
