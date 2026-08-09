import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

function formatNotificationDate(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString();
}

export default function NotificationCard({ item, onDelete, onMarkAsRead }) {
  const orderRef =
    item?.data?.orderRef || item?.data?.orderId || item?.data?.order_id;

  return (
    <View
      style={[
        styles.notificationCard,
        !item.read && styles.notificationCardUnread,
      ]}
    >
      <View style={styles.notificationCardHeader}>
        <View style={styles.notificationTitleRow}>
          {!item.read ? <View style={styles.unreadDot} /> : null}
          <Text style={styles.notificationTitle}>{item.title}</Text>
        </View>
        <Text style={styles.notificationDate}>
          {formatNotificationDate(item.createdAt)}
        </Text>
      </View>

      {item.body ? (
        <Text style={styles.notificationBody}>{item.body}</Text>
      ) : null}

      {orderRef ? (
        <View style={styles.notificationMetaPill}>
          <Text style={styles.notificationMetaText}>
            Order #{String(orderRef)}
          </Text>
        </View>
      ) : null}

      <View style={styles.notificationActions}>
        {!item.read ? (
          <Pressable
            style={styles.secondaryActionButton}
            onPress={() => onMarkAsRead(item.id)}
          >
            <Text style={styles.secondaryActionText}>Mark as read</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.deleteActionButton}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    notificationCard: {
      backgroundColor: colors.white,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 12,
      elevation: 3,
      gap: 12,
    },
    notificationCardUnread: {
      borderColor: colors.primary,
    },
    notificationCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    notificationTitleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    notificationTitle: {
      flex: 1,
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 17,
      fontWeight: "800",
      color: colors.textHeading,
    },
    notificationDate: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "right",
      maxWidth: 120,
    },
    notificationBody: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      lineHeight: 20,
      color: colors.textBody,
    },
    notificationMetaPill: {
      alignSelf: "flex-start",
      backgroundColor: colors.successTint,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    notificationMetaText: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: colors.primaryDark,
    },
    notificationActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    secondaryActionButton: {
      backgroundColor: colors.bgCream,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    secondaryActionText: {
      fontFamily: "Nunito_700Bold",
      fontSize: 13,
      fontWeight: "700",
      color: colors.primaryDark,
    },
    deleteActionButton: {
      backgroundColor: colors.bgEmptyDanger,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    deleteActionText: {
      fontFamily: "Nunito_700Bold",
      fontSize: 13,
      fontWeight: "700",
      color: colors.dangerText,
    },
  }),
};
