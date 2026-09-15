import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import { TabBarHeightProvider } from "../../context/TabBarHeightContext";

export const unstable_settings = {
  initialRouteName: "HomeTab",
};

export default function MainTabsLayout() {
  return (
    // Wraps the navigator so the bar can publish its measured height to the
    // screens rendered beside it.
    <TabBarHeightProvider>
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
          name="CartTab"
          options={{
            title: "Basket",
            tabBarLabel: "Basket",
            headerShown: true,
            // Solid like Home's, not transparent like Orders' and Profile's:
            // this screen's background is a near-white gradient, and a solid
            // header also reserves its own height, which the body assumes.
            headerTransparent: false,
            // Empty, as on every other tab - the delivery-location block set
            // in CartTab.js fills the bar instead of a centred title.
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
    </TabBarHeightProvider>
  );
}
