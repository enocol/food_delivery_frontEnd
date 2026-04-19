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
        tabBarActiveTintColor: "#ff6a00",
        tabBarInactiveTintColor: "rgba(33, 24, 17, 0.95)",
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { bottom: 16 + insets.bottom }],
        tabBarBackground: () => (
          <View style={styles.tabBarGlassWrap}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.74)",
                "rgba(255,255,255,0.58)",
                "rgba(214,233,250,0.62)",
              ]}
              start={{ x: 0.04, y: 0 }}
              end={{ x: 0.96, y: 1 }}
              style={styles.tabBarGlassAndroidFallback}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.78)",
                  "rgba(255,255,255,0.34)",
                  "rgba(255,255,255,0.14)",
                ]}
                start={{ x: 0.04, y: 0 }}
                end={{ x: 0.96, y: 1 }}
                style={styles.tabBarGlassTopShine}
              />
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.04)",
                  "rgba(219,237,255,0.32)",
                  "rgba(161,201,238,0.42)",
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.tabBarGlassBottomTint}
              />
              <View style={styles.tabBarGlassOrb} />
            </LinearGradient>
          </View>
        ),
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
        sceneStyle: { backgroundColor: "#fff", flex: 1 },
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
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
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
