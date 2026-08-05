import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";

export const unstable_settings = {
  initialRouteName: "HomeTab",
};

export default function MainTabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="HomeTab"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          headerShown: true,
          headerTransparent: false,
          headerTitle: "",
        }}
      />
      <Tabs.Screen
        name="OrdersTab"
        options={{
          title: "Orders",
          tabBarLabel: "Orders",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
        }}
      />
    </Tabs>
  );
}
