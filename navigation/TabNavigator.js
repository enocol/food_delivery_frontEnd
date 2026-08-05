import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";
import HomeScreen from "../screens/HomeScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#ff5a1f",
        tabBarInactiveTintColor: colors.black,
        tabBarStyle: [styles.tabBar, { bottom: 16 + insets.bottom }],
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          alignSelf: "center",
          margin: 5,
        },
        tabBarLabelStyle: styles.tabBarLabel,

        // sceneStyle: { backgroundColor: "red", flex: 1 },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName = "home-outline";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "OrdersTab") {
            iconName = focused ? "receipt" : "receipt-outline";
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
        options={{
          title: "Home",
          tabBarLabel: "Home",
          headerShown: true,
          headerTransparent: false,
          headerTitle: "",
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
        }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    tabBar: {
      position: "absolute",
      height: 82,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 20,
      paddingTop: Platform.OS === "android" ? 18 : 14,
      paddingBottom: Platform.OS === "android" ? 10 : 12,
      bottom: 14,
      overflow: "hidden",
      shadowColor: colors.dangerText,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      zIndex: 10,
    },

    tabBarLabel: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 12,
      fontWeight: "800",
    },
  }),
};
