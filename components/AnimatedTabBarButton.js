import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import sharedStyles from "./styles";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    tabButtonPressable: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    tabButtonContent: {
      justifyContent: "center",
      alignItems: "center",
    },
    tabButtonInner: {
      minWidth: 92,
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
    tabButtonInnerFocused: {
      backgroundColor: "#9ca3af",
      borderColor: "#6b7280",
      borderWidth: 2,
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 4,
    },
  }),
};

export default function AnimatedTabBarButton({
  children,
  accessibilityState,
  onPress,
  onLongPress,
  style,
  testID,
}) {
  const focused = Boolean(accessibilityState?.selected);
  const spring = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(spring, {
      toValue: focused ? 1 : 0,
      damping: 16,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [focused, spring]);

  const animatedStyle = {
    transform: [
      {
        scale: spring.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
      {
        translateY: spring.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
    ],
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabButtonPressable, style]}
    >
      <Animated.View
        style={[
          styles.tabButtonInner,
          focused ? styles.tabButtonInnerFocused : null,
          animatedStyle,
        ]}
      >
        <View style={styles.tabButtonContent}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}
