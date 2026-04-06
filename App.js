import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

  useEffect(() => {
    if (cartCount === 0) {
      closeCartSheet();
    }
  }, [cartCount, closeCartSheet]);

  const openCheckoutScreen = () => {
    closeCartSheet();
    if (navigationRef.isReady()) {
      navigationRef.navigate("Checkout");
    }
  };

  return (
    <>
      <StackNavigator />
      <CartBottomSheet
        visible={isCartSheetOpen && cartCount > 0}
        onClose={closeCartSheet}
        onCheckout={openCheckoutScreen}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
