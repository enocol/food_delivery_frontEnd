import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    cartHeaderButton: {
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginRight: 16,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cartHeaderIcon: {
      fontWeight: "800",
      color: colors.primaryBlack,
      fontSize: 24,
    },
    cartBadge: {
      backgroundColor: colors.primary,
      minWidth: 18,
      height: 18,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    cartBadgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: "800",
    },
  }),
};

export default function CartHeaderButton({ count, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.cartHeaderButton}>
      <Ionicons
        name="cart-outline"
        size={24}
        color={colors.primaryBlack}
        style={styles.cartHeaderIcon}
      />
      {count > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
