import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as colors from "../utils/colors";

export default function FloatingBasketButton({
  count,
  onPress,
  bottom = 16,
  variant = "default",
}) {
  const isVisible = Number(count) > 0;
  const [isRendered, setIsRendered] = useState(isVisible);
  const [displayCount, setDisplayCount] = useState(Number(count) || 0);
  const progress = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    if (isVisible) {
      setDisplayCount(Number(count) || 0);
      setIsRendered(true);
      progress.stopAnimation();
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 260,
        damping: 16,
        mass: 0.8,
      }).start();
      return;
    }

    if (!isRendered) {
      return;
    }

    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
    });
  }, [count, isRendered, isVisible, progress]);

  if (!isRendered) {
    return null;
  }

  const animatedStyle = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.host,
        variant === "compact" ? styles.hostCompact : styles.hostDefault,
        { bottom },
        animatedStyle,
      ]}
    >
      <Pressable
        style={[
          styles.button,
          variant === "compact" ? styles.buttonCompact : styles.buttonDefault,
        ]}
        onPress={onPress}
      >
        <Ionicons
          name="cart-outline"
          size={variant === "compact" ? 16 : 18}
          color={colors.white}
        />
        {variant !== "compact" ? (
          <Text style={styles.buttonText}>View Basket</Text>
        ) : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    zIndex: 30,
  },
  hostDefault: {
    left: "30%",
    right: "30%",
  },
  hostCompact: {
    right: 14,
    alignSelf: "flex-end",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#ff5a1f",
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDefault: {
    paddingVertical: 14,
  },
  buttonCompact: {
    width: 52,
    height: 52,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 26,
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#ff5a1f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },
  buttonText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
});
