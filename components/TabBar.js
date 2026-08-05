import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import sharedStyles from "./styles";
import * as colors from "../utils/colors";

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
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { bottom: 16 + insets.bottom }]}>
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
          <Pressable
            key={route.key}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={getIconName(route.name, focused)}
                size={focused ? 30 : 30}
                color={color}
              />
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    tabBar: {
      position: "absolute",
      left: 20,
      right: 20,
      height: 82,
      borderRadius: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: Platform.OS === "android" ? 18 : 14,
      paddingBottom: Platform.OS === "android" ? 10 : 12,
      overflow: "hidden",
      shadowColor: colors.dangerText,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      zIndex: 10,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    tabContent: {
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    tabLabel: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 12,
      fontWeight: "800",
      color: colors.primary,
    },
  }),
};
