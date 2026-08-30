import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import * as colors from "../utils/colors";

// The header back control for iOS only. iOS's native control draws a chevron
// plus the previous screen's title, which varies screen to screen; this draws
// a bare Material arrow instead so it looks the same everywhere. Android keeps
// its own native header back button (see platformBackButton in app/_layout.js),
// so this component is not wired up there.
//
// `arrow-back` from MaterialIcons is the exact glyph Android uses natively, and
// that font is already in the bundle.
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
