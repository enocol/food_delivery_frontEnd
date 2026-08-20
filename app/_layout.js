import "react-native-reanimated";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnimatedSplash from "../components/AnimatedSplash";
import CartBottomSheet from "../components/CartBottomSheet";
import HeaderBackButton from "../components/HeaderBackButton";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider, useCart } from "../context/CartContext";
import {
  NotificationsProvider,
  useNotifications,
} from "../context/NotificationsContext";
import { auth } from "../utils/firebase";
import { markAppReady } from "../utils/appReady";
import { consumePostAuthRedirect } from "../utils/postAuthRedirect";
import * as colors from "../utils/colors";

auth.languageCode = "en";

// Hold the OS splash until <AnimatedSplash /> has laid out, so there is never
// a blank frame between the two.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

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
  const { user, authLoading, emailVerified } = useAuth();
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

    // Guests browse freely — the account requirement is enforced at checkout,
    // not at the door. So the only redirect left is moving someone who has just
    // signed in off the auth screens.
    // Distinguishes "just came through an auth screen" from "cold start with a
    // restored session", where segments[0] is briefly empty. Only the first
    // should trigger the verification prompt - otherwise an unverified user is
    // dumped on the verify screen every launch and can never browse.
    const cameFromAuthScreen =
      rootSegment === "Auth" ||
      rootSegment === "Register" ||
      rootSegment === "ForgotPassword";

    if (isAuthenticated && (!rootSegment || cameFromAuthScreen)) {
      if (!emailVerified && cameFromAuthScreen) {
        // Ask right after signing up, while the address is still fresh and the
        // user is in setup mode - rather than later, when they are reaching for
        // payment. Any queued destination is deliberately left in place so the
        // verify screen can send them on once they are through.
        router.replace("/VerifyEmail");
      } else {
        // Someone who was interrupted mid-checkout goes back there rather than
        // to the home tab.
        router.replace(consumePostAuthRedirect() || "/MainTabs/HomeTab");
      }
    }

    // Signing out drops you back into browsing as a guest, not onto a login wall.
    if (wasAuthenticated && !isAuthenticated) {
      router.replace("/MainTabs/HomeTab");
    }

    previousUserRef.current = user;
  }, [authLoading, emailVerified, router, segments, user]);

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
        <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" options={{ headerShown: false }} />
        <Stack.Screen
          name="Notifications"
          options={{
            title: "Notifications",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#ff5a1f",
            },
            headerTransparent: true,
            headerTitleStyle: {
              color: "#fff",
              fontSize: 20,
              fontWeight: "bold",
            },
            headerBackVisible: false,
            // White to match the title on this screen's orange header.
            headerLeft: () => <HeaderBackButton color={colors.white} />,
          }}
        />
        <Stack.Screen
          name="RestaurantDetails"
          options={{
            title: "",
            headerTransparent: true,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton color={colors.black} />,
          }}
        />
        <Stack.Screen
          name="VerifyEmail"
          options={{
            title: "",
            headerShown: true,
            headerTransparent: true,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton color={colors.black} />,
          }}
        />
        <Stack.Screen
          name="Checkout"
          options={{
            title: "",
            headerShown: true,
            headerTransparent: true,
            headerBackVisible: false,
            headerLeft: () => <HeaderBackButton color={colors.black} />,
          }}
        />
      </Stack>
      {/* Mounted for guests too: they build carts before they have accounts. */}
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
    </>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Handing off on layout (rather than on mount) guarantees the animated
  // splash is already on screen before the OS one goes away.
  const handleSplashLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    // Releases anything holding back OS-level prompts until a real screen is
    // on display — see utils/appReady.js.
    markAppReady();
    setSplashDone(true);
  }, []);

  // Fonts are bundled locally, so this is a frame or two at most — the OS
  // splash is still covering the screen for it. On a font error we carry on
  // with system fonts rather than holding the OS splash open forever.
  if (!fontsLoaded && !fontError) {
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
      {/* Rendered last so it sits above the app, which boots (auth, cart,
          socket) behind it while the branding plays. */}
      {splashDone ? null : (
        <AnimatedSplash
          onLayout={handleSplashLayout}
          onFinish={handleSplashFinish}
        />
      )}
    </SafeAreaProvider>
  );
}
