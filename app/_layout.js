import "react-native-reanimated";
import React, { useEffect, useRef } from "react";
import { Image, View } from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import CartBottomSheet from "../components/CartBottomSheet";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import {
  NotificationsProvider,
  useNotifications,
} from "../context/NotificationsContext";
import { auth } from "../utils/firebase";
import * as colors from "../utils/colors";

auth.languageCode = "en";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, authLoading } = useAuth();
  const previousUserRef = useRef(user);
  const { closeCartSheet, isCartSheetOpen } = useCart();
  const { saveExpoNotification } = useNotifications();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const wasAuthenticated = Boolean(previousUserRef.current);
    const isAuthenticated = Boolean(user);
    const rootSegment = segments[0];

    if (!isAuthenticated) {
      if (
        rootSegment !== "Auth" &&
        rootSegment !== "Register" &&
        rootSegment !== "ForgotPassword"
      ) {
        router.replace("/Auth");
      }
    } else if (
      !rootSegment ||
      rootSegment === "Auth" ||
      rootSegment === "Register" ||
      rootSegment === "ForgotPassword"
    ) {
      router.replace("/MainTabs/HomeTab");
    }

    if (wasAuthenticated && !isAuthenticated) {
      router.replace("/Auth");
    }

    previousUserRef.current = user;
  }, [authLoading, router, segments, user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const handleNotificationResponse = (response) => {
      saveExpoNotification(response?.notification);
      router.navigate("/Notifications");
    };

    const handleNotificationReceived = (notification) => {
      saveExpoNotification(notification);
    };

    const receivedSub = Notifications.addNotificationReceivedListener(
      handleNotificationReceived,
    );
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
  }, [router, saveExpoNotification, user]);

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
          source={require("../assets/splash-icon.png")}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="Auth" options={{ headerShown: false }} />
        <Stack.Screen name="Register" options={{ headerShown: false }} />
        <Stack.Screen
          name="ForgotPassword"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MainTabs" options={{ headerShown: false }} />
        <Stack.Screen
          name="Notifications"
          options={{
            title: "Notifications",
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",

            headerStyle: {
              backgroundColor: "#ff5a1f",
            },
            headerTransparent: true,
            headerTitleStyle: {
              color: "#fff",
              fontSize: 20,
              fontWeight: "bold",
            },
            // headerRight: () => (
            //   <View
            //     style={{
            //       marginRight: 16,
            //       alignItems: "center",
            //       justifyContent: "center",
            //     }}
            //   >
            //     {/* <Ionicons name="notifications" size={24} color={colors.white} /> */}
            //   </View>
            // ),
          }}
        />
        <Stack.Screen
          name="RestaurantDetails"
          options={{
            title: "",
            headerTransparent: true,
            headerBackVisible: true,
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: colors.black,
          }}
        />
        <Stack.Screen
          name="Checkout"
          options={{
            title: "",
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerBackTitleVisible: false,
            headerBackVisible: true,
            headerTransparent: true,
            headerTintColor: colors.black,
          }}
        />
      </Stack>
      {user ? (
        <CartBottomSheet
          visible={isCartSheetOpen}
          onClose={closeCartSheet}
          onCheckout={() => {
            closeCartSheet();
            router.navigate("/Checkout");
          }}
          onOrderNow={() => {
            closeCartSheet();
            router.navigate("/MainTabs/HomeTab");
          }}
        />
      ) : null}
    </>
  );
}

export default function RootLayout() {
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
        <NotificationsProvider>
          <CartProvider>
            <RootNavigator />
          </CartProvider>
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
