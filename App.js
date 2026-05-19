import React from "react";
import { View, Text } from "react-native";
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
      <StackNavigator />
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
    return <View style={{ flex: 1, backgroundColor: "#FF0000" }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
