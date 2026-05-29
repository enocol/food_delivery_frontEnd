import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";
import HomeScreen from "../screens/HomeScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    tabBar: {
      position: "absolute",
      // backgroundColor: colors.overlays.tabBarBg,
      height: 75,
      borderRadius: 24,
      borderWidth: 1,
      // borderColor: colors.overlays.tabBarBorder,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 20,
      paddingTop: Platform.OS === "android" ? 20 : 15,
      bottom: 16,
      overflow: "hidden",
      elevation: 18,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
    },
    tabBarGlassWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: colors.amberLight,
    },
    tabBarLabel: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 12,
      fontWeight: "800",
    },
  }),
};

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.black,
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
