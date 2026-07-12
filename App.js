import React, { useState, useEffect } from "react";
import * as colors from "./utils/colors";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSocket } from "./utils/socket";
import * as Haptics from "expo-haptics";
import { playOrderStatusSound } from "./utils/cartFeedback";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import CartBottomSheet from "./components/CartBottomSheet";
import styles from "./components/styles";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import AuthScreen from "./screens/AuthScreen";
import RegisterScreen from "./screens/RegisterScreen";
import StackNavigator, { navigationRef } from "./navigation/StackNavigator";

function AppContent() {
  const { user, authLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState("signIn");

  useEffect(() => {
    if (!user) {
      setAuthScreen("signIn");
    }
  }, [user]);

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Loading account...</Text>
      </View>
    );
  }

  if (!user) {
    return authScreen === "register" ? (
      <RegisterScreen onGoToSignIn={() => setAuthScreen("signIn")} />
    ) : (
      <AuthScreen onGoToCreateAccount={() => setAuthScreen("register")} />
    );
  }

  return (
    <CartProvider>
      <AuthenticatedApp />
    </CartProvider>
  );
}

function getNotifConfig(status) {
  switch (status) {
    case "confirmed":
      return {
        iconName: "checkmark-circle",
        iconColor: "#0d9668",
        iconCircleStyle: "iconCircleAccepted",
        title: "Order Accepted!",
        body: "Your order has been accepted and is being prepared.",
        buttonStyle: "buttonAccepted",
        buttonLabel: "Got it",
        haptic: Haptics.NotificationFeedbackType.Success,
      };
    case "ready_for_pickup":
      // case "readyForPickup":
      // case "ready for pickup":
      return {
        iconName: "bicycle",
        iconColor: "#0284c7",
        iconCircleStyle: "iconCircleReady",
        title: "Order Ready for Delivery!",
        body: "Your order is ready to be delivered. A rider is on the way!",
        buttonStyle: "buttonReady",
        buttonLabel: "Got it",
        haptic: Haptics.NotificationFeedbackType.Success,
      };
    case "cancelled":
    default:
      return {
        iconName: "close-circle",
        iconColor: "#dc2626",
        iconCircleStyle: "iconCircleCancelled",
        title: "Order Cancelled",
        body: "Your order has been cancelled by the restaurant.",
        buttonStyle: "buttonCancelled",
        buttonLabel: "Dismiss",
        haptic: Haptics.NotificationFeedbackType.Error,
      };
  }
}

function AuthenticatedApp() {
  const { cartCount, isCartSheetOpen, closeCartSheet } = useCart();
  const [statusNotifications, setStatusNotifications] = useState([]);
  const statusNotification = statusNotifications[0] || null;
  const notificationCount = statusNotifications.length;

  useEffect(() => {
    const handleStatusUpdate = ({ orderId, status, updatedAt }) => {
      setStatusNotifications((previous) => [
        ...previous,
        { orderId, status, updatedAt },
      ]);
      playOrderStatusSound();
      const config = getNotifConfig(status);
      Haptics.notificationAsync(config.haptic).catch(() => {});
    };

    let detach = null;
    const attachListener = () => {
      const socket = getSocket();
      if (!socket) {
        return false;
      }

      socket.on("order_status_updated", handleStatusUpdate);
      detach = () => socket.off("order_status_updated", handleStatusUpdate);
      return true;
    };

    if (!attachListener()) {
      const timer = setInterval(() => {
        if (attachListener()) {
          clearInterval(timer);
        }
      }, 250);

      return () => {
        clearInterval(timer);
        if (detach) {
          detach();
        }
      };
    }

    return () => {
      if (detach) {
        detach();
      }
    };
  }, []);

  const openCheckoutScreen = () => {
    closeCartSheet();
    if (navigationRef.isReady()) {
      navigationRef.navigate("Checkout");
    }
  };

  const handleOrderNow = () => {
    closeCartSheet();
    if (navigationRef.isReady()) {
      navigationRef.navigate("MainTabs", { screen: "HomeTab" });
    }
  };

  const config = getNotifConfig(statusNotification?.status);
  const currentIndex = statusNotification ? 1 : 0;

  const timeLabel = statusNotification?.updatedAt
    ? new Date(statusNotification.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  return (
    <>
      <StackNavigator />
      <CartBottomSheet
        visible={isCartSheetOpen}
        onClose={closeCartSheet}
        onCheckout={openCheckoutScreen}
        onOrderNow={handleOrderNow}
      />

      <Modal
        visible={!!statusNotification}
        transparent
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={notifStyles.overlay}>
          <View style={notifStyles.sheet}>
            <View style={notifStyles.headerRow}>
              <View style={notifStyles.countBadge}>
                <Text style={notifStyles.countBadgeText}>
                  {currentIndex} of {notificationCount}
                </Text>
              </View>

              <Pressable
                style={notifStyles.closeButton}
                onPress={() =>
                  setStatusNotifications((previous) => previous.slice(1))
                }
              >
                <Ionicons name="close" size={20} color={colors.textWarmDark} />
              </Pressable>
            </View>

            <View style={notifStyles.handle} />

            <View
              style={[
                notifStyles.iconCircle,
                notifStyles[config.iconCircleStyle],
              ]}
            >
              <Ionicons
                name={config.iconName}
                size={38}
                color={config.iconColor}
              />
            </View>

            <Text style={notifStyles.title}>{config.title}</Text>

            <Text style={notifStyles.body}>{config.body}</Text>

            <Text style={notifStyles.timestamp}>{timeLabel}</Text>

            <View style={notifStyles.queueStatusRow}>
              <View style={notifStyles.queueDot} />
              <Text style={notifStyles.queueStatusText}>
                {notificationCount > 1
                  ? `Showing the next notification now, with ${notificationCount - 1} waiting in the queue.`
                  : "You are viewing the only notification in the queue."}
              </Text>
            </View>

            <Text style={notifStyles.queueHint}>
              {notificationCount > 1
                ? `${notificationCount - 1} more ${
                    notificationCount - 1 === 1
                      ? "notification"
                      : "notifications"
                  } queued`
                : ""}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const notifStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12, 35, 64, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countBadge: {
    backgroundColor: colors.bgWarmAlt,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countBadgeText: {
    fontFamily: "Nunito_700Bold",
    color: colors.textDark,
    fontSize: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlays.closeButtonBg,
    borderWidth: 1,
    borderColor: colors.borderMid,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#cbd5e1",
    marginBottom: 18,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircleAccepted: { backgroundColor: "#dcfce7" },
  iconCircleReady: { backgroundColor: "#e0f2fe" },
  iconCircleCancelled: { backgroundColor: "#fee2e2" },
  title: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 18,
    color: "#0c2340",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 6,
  },
  timestamp: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 24,
  },
  queueHint: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: colors.textMuted,
    minHeight: 16,
    marginBottom: 4,
  },
  queueStatusRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgWarmAlt,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  queueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  queueStatusText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    lineHeight: 17,
    color: colors.textDark,
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonAccepted: { backgroundColor: "#0d9668" },
  buttonReady: { backgroundColor: "#0284c7" },
  buttonCancelled: { backgroundColor: "#dc2626" },
  buttonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#ffffff",
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.splash }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
