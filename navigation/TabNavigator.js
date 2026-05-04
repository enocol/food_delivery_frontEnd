import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../components/styles";
import HomeScreen from "../screens/HomeScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "red",
        tabBarInactiveTintColor: "#ffffff",
        tabBarStyle: [styles.tabBar, { bottom: 16 + insets.bottom }],
        tabBarBackground: () => <View style={styles.tabBarGlassWrap}></View>,

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
          title: "",
          tabBarLabel: "",
          headerShown: true,
          headerTransparent: false,
          headerTitle: "",
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: "",
          tabBarLabel: "",
          headerShown: true,
          headerTransparent: true,
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
          headerTransparent: true,
          headerTitle: "",
        }}
      />
    </Tab.Navigator>
  );
}
