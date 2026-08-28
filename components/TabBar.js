import React, { useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// import sharedStyles from "./styles";
import * as colors from "../utils/colors";
import TabBarButton from "./TabBarButton";

// Caps the floating pill's width so it doesn't stretch nearly edge-to-edge
// on tablets - a no-op on phones, which never reach this width.
const TAB_BAR_MAX_WIDTH = 480;

function getIconName(routeName, focused) {
  if (routeName === "HomeTab") {
    return focused ? "home" : "home-outline";
  }

  if (routeName === "OrdersTab") {
    return focused ? "receipt" : "receipt-outline";
  }

  if (routeName === "ProfileTab") {
    return focused ? "person" : "person-outline";
  }

  return "ellipse-outline";
}

export default function TabBar({ state, descriptors, navigation }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [contentWidths, setContentWidths] = useState({});
  const contentWidth = Math.max(0, dimensions.width - 24);
  const buttonWidth =
    state.routes.length > 0 ? contentWidth / state.routes.length : 0;
  const activeRouteKey = state.routes[state.index]?.key;
  const activeContentWidth = activeRouteKey ? contentWidths[activeRouteKey] : 0;
  //   setting the pill with
  const pillWidth = activeContentWidth
    ? Math.min(buttonWidth - 4, activeContentWidth + 32)
    : Math.max(60, buttonWidth * 0.74);
  const pillOffsetX = Math.max(0, (buttonWidth - pillWidth) / 2);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const tabBarWidth = Math.min(windowWidth - 40, TAB_BAR_MAX_WIDTH);

  const onTabbarLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const handleButtonContentLayout = (routeKey) => (event) => {
    const { width } = event.nativeEvent.layout;
    setContentWidths((previous) =>
      previous[routeKey] === width
        ? previous
        : {
            ...previous,
            [routeKey]: width,
          },
    );
  };

  const tabPositionX = useSharedValue(0);

  const springConfig = {
    damping: 9,
    stiffness: 175,
    mass: 0.75,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  };

  useEffect(() => {
    tabPositionX.value = withSpring(
      state.index * buttonWidth + pillOffsetX,
      springConfig,
    );
  }, [buttonWidth, pillOffsetX, state.index, tabPositionX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View
      onLayout={onTabbarLayout}
      style={[
        styles.tabBar,
        { bottom: 16 + insets.bottom, width: tabBarWidth },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          animatedStyle,
          {
            left: 12,
            width: pillWidth,
            height: Math.max(0, dimensions.height - 28),
          },
        ]}
      />

      <View style={styles.buttonsRow}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor?.options || {};
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const focused = state.index === index;
          const color = focused ? "#ff5a1f" : colors.black;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabBarButton
              key={route.key}
              routeKey={route.key}
              focused={focused}
              onContentLayout={handleButtonContentLayout(route.key)}
              onPress={onPress}
              onLongPress={onLongPress}
              iconName={getIconName(route.name, focused)}
              color={color}
              label={label}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = {
  ...StyleSheet.create({
    tabBar: {
      position: "absolute",
      alignSelf: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 32,
      justifyContent: "center",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 1,
      shadowOffset: { width: 10, height: 10 },
      shadowRadius: 10,
      backgroundColor: colors.successTint,
    },
    buttonsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 1,
    },
    indicator: {
      position: "absolute",
      top: 14,
      borderRadius: 999,
      backgroundColor: colors.danger,
      zIndex: 0,
      elevation: -1,
    },
  }),
};
