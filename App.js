import React, { useState, useEffect } from "react";
import * as colors from "./utils/colors";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSocket } from "./utils/socket";
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
import StackNavigator, { navigationRef } from "./navigation/StackNavigator";

function AppContent() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Loading account...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <CartProvider>
      <AuthenticatedApp />
    </CartProvider>
  );
}

function AuthenticatedApp() {
  const { cartCount, isCartSheetOpen, closeCartSheet } = useCart();
  const [statusNotification, setStatusNotification] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status, updatedAt }) => {
      setStatusNotification({ orderId, status, updatedAt });
    };

    socket.on("order_status_updated", handleStatusUpdate);
    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
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

  const isAccepted = statusNotification?.status === "confirmed";

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
        onRequestClose={() => setStatusNotification(null)}
      >
        {/* Tapping the dimmed backdrop dismisses */}
        <Pressable
          style={notifStyles.overlay}
          onPress={() => setStatusNotification(null)}
        >
          {/* Inner press stops propagation so tapping the sheet doesn't close */}
          <Pressable style={notifStyles.sheet} onPress={() => {}}>
            <View style={notifStyles.handle} />

            <View
              style={[
                notifStyles.iconCircle,
                isAccepted
                  ? notifStyles.iconCircleAccepted
                  : notifStyles.iconCircleCancelled,
              ]}
            >
              <Ionicons
                name={isAccepted ? "checkmark-circle" : "close-circle"}
                size={38}
                color={isAccepted ? "#0d9668" : "#dc2626"}
              />
            </View>

            <Text style={notifStyles.title}>
              {isAccepted ? "Order Accepted!" : "Order Cancelled"}
            </Text>

            <Text style={notifStyles.body}>
              {isAccepted
                ? "Your order has been accepted and is being prepared."
                : "Your order has been cancelled by the restaurant."}
            </Text>

            <Text style={notifStyles.timestamp}>{timeLabel}</Text>

            <Pressable
              style={[
                notifStyles.button,
                isAccepted
                  ? notifStyles.buttonAccepted
                  : notifStyles.buttonCancelled,
              ]}
              onPress={() => setStatusNotification(null)}
            >
              <Text style={notifStyles.buttonText}>
                {isAccepted ? "Got it" : "Dismiss"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#cbd5e1",
    marginBottom: 20,
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
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonAccepted: { backgroundColor: "#0d9668" },
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
