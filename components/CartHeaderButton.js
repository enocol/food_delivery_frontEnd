import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    cartHeaderButton: {
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginRight: 16,
      borderWidth: 1,
      borderColor: "#e6ded1",
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cartHeaderIcon: {
      fontWeight: "800",
      color: "#bd3f1b",
      fontSize: 24,
    },
    cartBadge: {
      backgroundColor: "#bd3f1b",
      minWidth: 18,
      height: 18,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    cartBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
  }),
};

export default function CartHeaderButton({ count, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.cartHeaderButton}>
      <Ionicons
        name="basket-outline"
        size={24}
        color="#bd3f1b"
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
