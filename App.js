import React, { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Platform,
  Pressable,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import AnimatedTabBarButton from "./components/AnimatedTabBarButton";
import CartBottomSheet from "./components/CartBottomSheet";
import styles from "./components/styles";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import AuthScreen from "./screens/AuthScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RestaurantDetailsScreen from "./screens/RestaurantDetailsScreen";
import SearchScreen from "./screens/SearchScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#ff6600",
        tabBarInactiveTintColor: "#ffffff",
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          alignSelf: "center",
          margin: 0,
        },

        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: true,
        sceneStyle: { backgroundColor: "#fff" },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName = "home-outline";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "SearchTab") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={focused ? 30 : (size ?? 30)}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "", tabBarLabel: "", headerShown: true }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          title: "",
          tabBarLabel: "",
          headerShown: true,
          headerTransparent: false,
          headerTitle: "",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "",
          tabBarLabel: "",
          headerShown: true,
          headerTransparent: false,
          headerTitle: "",
        }}
      />
    </Tab.Navigator>
  );
}

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
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: styles.headerTitle,
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={{
              title: "Restaurant",
              headerBackLabelVisible: false,
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={({ navigation }) => ({
              title: "",
              headerShown: true,
              headerTransparent: true,
              headerTitle: "",
              headerBackTitle: "",
              headerBackButtonDisplayMode: "minimal",
              headerBackTitleVisible: false,
              headerBackVisible: Platform.OS !== "ios",
              headerLeftContainerStyle:
                Platform.OS === "ios"
                  ? {
                      paddingLeft: 8,
                    }
                  : undefined,
              headerLeft:
                Platform.OS === "ios"
                  ? () => (
                      <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        activeOpacity={0.7}
                        style={{ paddingHorizontal: 6, paddingVertical: 6 }}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={30}
                          color="#000000"
                        />
                      </Pressable>
                    )
                  : undefined,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>

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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
