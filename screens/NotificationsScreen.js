import React, { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationCard from "../components/NotificationCard";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import { useNotifications } from "../context/NotificationsContext";
import { useTransparentHeaderOffset } from "../utils/responsive";
import * as colors from "../utils/colors";

export default function NotificationsScreen({ navigation: navigationProp }) {
  const routeNavigation = useNavigation();
  const navigation = navigationProp ?? routeNavigation;
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  } = useNotifications();

  //   useRootCartHeader(navigation, "Notification", {
  //     headerHeight: 80,
  //     headerBackgroundColor: "#ff5a1f",
  //   });

  const headerOffset = useTransparentHeaderOffset();

  const renderItem = useCallback(
    ({ item }) => (
      <NotificationCard
        item={item}
        onDelete={deleteNotification}
        onMarkAsRead={markAsRead}
      />
    ),
    [deleteNotification, markAsRead],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <LinearGradient
        colors={colors.gradients.warmCream}
        style={[styles.gradientBackground, { paddingTop: headerOffset }]}
      >
        {notifications.length ? (
          <>
            <View style={styles.actionsRow}>
              <View>
                <Text style={styles.heading}>Notifications</Text>
                <Text style={styles.subheading}>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "All caught up"}
                </Text>
              </View>
              <View style={styles.bulkActions}>
                {unreadCount > 0 ? (
                  <Pressable
                    style={styles.secondaryActionButton}
                    onPress={markAllAsRead}
                  >
                    <Text style={styles.secondaryActionText}>
                      Mark all read
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.deleteActionButton}
                  onPress={clearNotifications}
                >
                  <Text style={styles.deleteActionText}>Clear all</Text>
                </Pressable>
              </View>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={34}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              Incoming order and account updates will stay here until you delete
              them.
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.white,
    },
    gradientBackground: {
      flex: 1,
      paddingHorizontal: 16,
    },
    actionsRow: {
      gap: 12,
      marginBottom: 16,
    },
    heading: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 28,
      color: colors.textHeading,
    },
    subheading: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    bulkActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    listContent: {
      paddingBottom: 24,
      gap: 12,
    },
    secondaryActionButton: {
      backgroundColor: colors.bgCream,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    secondaryActionText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 13,
      color: colors.primaryDark,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyIconWrap: {
      width: 78,
      height: 78,
      borderRadius: 39,
      //   backgroundColor: colors.bgEmptyOrange,
      borderWidth: 1,
      borderColor: colors.borderOrange,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 22,
      color: colors.textHeading,
    },
    emptySub: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 8,
      textAlign: "center",
      lineHeight: 20,
    },
  }),
};
