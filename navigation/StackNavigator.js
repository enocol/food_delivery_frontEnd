import { Ionicons } from "@expo/vector-icons";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, Pressable } from "react-native";
import styles from "../components/styles";
import CheckoutScreen from "../screens/CheckoutScreen";
import RestaurantDetailsScreen from "../screens/RestaurantDetailsScreen";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

export default function StackNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShadowVisible: false,
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
            headerTitle: "",
            headerBackVisible: false,
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
                      <Ionicons name="chevron-back" size={30} color="#000000" />
                    </Pressable>
                  )
                : undefined,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
