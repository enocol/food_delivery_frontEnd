import React, { useEffect, useRef } from "react";
import * as colors from "./utils/colors";
import { View, Text, Image } from "react-native";
import * as Notifications from "expo-notifications";
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
import StackNavigator, { navigationRef } from "./navigation/StackNavigator";

// Show push notifications while app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const { user, authLoading } = useAuth();
  const previousUserRef = useRef(user);

  useEffect(() => {
    const wasAuthenticated = Boolean(previousUserRef.current);
    const isAuthenticated = Boolean(user);
    let timeoutId = null;

    const resetToAuthRoute = (attempt = 0) => {
      if (navigationRef.isReady()) {
        navigationRef.resetRoot({
          index: 0,
          routes: [{ name: "Auth" }],
        });
        return;
      }

      if (attempt >= 5) {
        return;
      }

      timeoutId = setTimeout(() => {
        resetToAuthRoute(attempt + 1);
      }, 60);
    };

    if (wasAuthenticated && !isAuthenticated) {
      resetToAuthRoute();
    }

    previousUserRef.current = user;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.splash,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("./assets/splash-icon.png")}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (!user) {
    return <StackNavigator isAuthenticated={false} />;
  }

  return (
    <CartProvider>
      <AuthenticatedApp />
    </CartProvider>
  );
}

function AuthenticatedApp() {
  const { cartCount, isCartSheetOpen, closeCartSheet } = useCart();

  useEffect(() => {
    const handleNotificationResponse = (response) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate("MainTabs", { screen: "OrdersTab" });
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener(() => {});
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          handleNotificationResponse(response);
        }
      })
      .catch(() => {});

    return () => {
      receivedSub.remove();
      responseSub.remove();
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

  return (
    <>
      <StackNavigator isAuthenticated />
      <CartBottomSheet
        visible={isCartSheetOpen}
        onClose={closeCartSheet}
        onCheckout={openCheckoutScreen}
        onOrderNow={handleOrderNow}
      />
    </>
  );
}

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
