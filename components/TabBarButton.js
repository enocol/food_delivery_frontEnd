import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { useAnimatedStyle, interpolate } from "react-native-reanimated";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";

export default function TabBarButton({
  routeKey,
  focused,
  onContentLayout,
  onPress,
  onLongPress,
  iconName,
  color,
  label,
}) {
  const scale = useSharedValue(0);
  const buttonColor = focused ? "#FFFFFF" : color;
  const buttonSpringConfig = {
    damping: 14,
    stiffness: 220,
    mass: 0.7,
    overshootClamping: true,
  };

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, buttonSpringConfig);
  }, [scale, focused]);

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return {
      opacity,
      height: interpolate(scale.value, [0, 1], [14, 0]),
      marginTop: interpolate(scale.value, [0, 1], [4, 0]),
      overflow: "hidden",
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1]);
    return {
      transform: [
        { scale: scaleValue },
        { translateY: interpolate(scale.value, [0, 1], [0, -2]) },
      ],
    };
  });
  return (
    <Pressable
      key={routeKey}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <View onLayout={onContentLayout} style={styles.contentWrap}>
        <Animated.View style={animatedIconStyle}>
          <Ionicons name={iconName} size={30} color={buttonColor} />
        </Animated.View>
        <Animated.View style={animatedTextStyle}>
          <Animated.Text style={[styles.tabLabel, { color: buttonColor }]}>
            {label}
          </Animated.Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    fontWeight: "800",
  },
});
