import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import sharedStyles from "../components/styles";
import AuthScreen from "../screens/AuthScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RestaurantDetailsScreen from "../screens/RestaurantDetailsScreen";
import TabNavigator from "./TabNavigator";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    headerTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontWeight: "800",
      fontSize: 18,
      letterSpacing: 0.4,
    },
  }),
};

const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

export default function StackNavigator({ isAuthenticated = true }) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainTabs" : "Auth"}
        screenOptions={{
          headerShadowBackgroundColor: colors.black,
          headerTitleStyle: styles.headerTitle,
          headerShown: true,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="RestaurantDetails"
              component={RestaurantDetailsScreen}
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
              component={CheckoutScreen}
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
          </>
        ) : (
          <>
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
