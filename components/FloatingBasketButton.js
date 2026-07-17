import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as colors from "../utils/colors";

export default function FloatingBasketButton({
  count,
  onPress,
  bottom = 16,
  variant = "default",
}) {
  if (!count || count <= 0) {
    return null;
  }

  return (
    <Pressable
      style={[
        styles.button,
        variant === "compact" ? styles.buttonCompact : styles.buttonDefault,
        { bottom },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name="cart-outline"
        size={variant === "compact" ? 16 : 18}
        color={colors.white}
      />
      {variant !== "compact" ? (
        <Text style={styles.buttonText}>View Basket</Text>
      ) : null}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 30,
  },
  buttonDefault: {
    left: "30%",
    right: "30%",
    paddingVertical: 14,
  },
  buttonCompact: {
    right: 14,
    width: 52,
    height: 52,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 26,
    alignSelf: "flex-end",
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    fontWeight: "800",
    color: colors.textWarmDark,
  },
  buttonText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
});
