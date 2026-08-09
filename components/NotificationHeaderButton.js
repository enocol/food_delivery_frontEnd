import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    notificationHeaderButton: {
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginRight: 16,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationHeaderIcon: {
      fontWeight: "800",
      color: colors.white,
      fontSize: 24,
    },
    notificationBadge: {
      position: "absolute",
      top: 1,
      right: 2,
      backgroundColor: colors.primary,
      minWidth: 18,
      height: 18,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: colors.white,
    },
    notificationBadgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: "800",
    },
  }),
};

function formatCount(count) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export default function NotificationHeaderButton({ count = 0, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.notificationHeaderButton}>
      <Ionicons
        name="notifications-outline"
        size={24}
        color={colors.white}
        style={styles.notificationHeaderIcon}
      />
      {count > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{formatCount(count)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
