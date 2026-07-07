import { Ionicons } from "@expo/vector-icons";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, Pressable, StyleSheet } from "react-native";
import sharedStyles from "../components/styles";
import CheckoutScreen from "../screens/CheckoutScreen";
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

export default function StackNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShadowBackgroundColor: colors.black,
          headerTitleStyle: styles.headerTitle,
          headerShown: true,
        }}
      >
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
          options={({ navigation }) => ({
            title: "",
            headerShown: true,
            headerBackButtonDisplayMode: "minimal",
            headerBackTitleVisible: false,
            headerBackVisible: true,
            headerTransparent: true,
            headerTintColor: colors.black,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
