import React, { useEffect, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as colors from "../utils/colors";
import { useNetworkStatus } from "../context/NetworkStatusContext";

// A heads-up notification-style banner: slides down from the top, sits below
// the status bar, floats above every screen (it is mounted once, above the
// navigator), and stays until the connection recovers or the user dismisses it.
//
// Deliberately not a react-native <Modal>: Modal captures the Android hardware
// back button unless onRequestClose navigates away, which would trap the user
// for as long as the outage lasts. An absolutely-positioned sibling of the
// navigator gives the same "above everything, survives navigation" behaviour
// without that.

const HIDDEN_Y = -180;
const ENTER_SPRING = { damping: 18, stiffness: 180, mass: 0.9 };
const SWIPE_DISMISS_DY = -40;

export default function NetworkStatusBanner() {
  const { visible, message, dismiss } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  // Stay mounted through the slide-out, then unmount.
  const [rendered, setRendered] = useState(visible);
  const translateY = useSharedValue(HIDDEN_Y);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      translateY.value = withSpring(0, ENTER_SPRING);
      opacity.value = withTiming(1, { duration: 180 });
      return;
    }

    if (rendered) {
      opacity.value = withTiming(0, { duration: 160 });
      translateY.value = withTiming(HIDDEN_Y, { duration: 220 }, (done) => {
        if (done) {
          runOnJS(setRendered)(false);
        }
      });
    }
  }, [visible, rendered, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Swipe up to dismiss, the same gesture a real notification banner uses.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy < -6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_evt, gesture) => {
        const dy = Math.min(0, gesture.dy);
        translateY.value = dy;
        opacity.value = Math.max(0, 1 + dy / 120);
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy < SWIPE_DISMISS_DY) {
          translateY.value = withTiming(HIDDEN_Y, { duration: 160 });
          opacity.value = withTiming(0, { duration: 140 });
          // Already on the JS thread here, so call straight through.
          dismiss();
        } else {
          translateY.value = withSpring(0, ENTER_SPRING);
          opacity.value = withTiming(1, { duration: 120 });
        }
      },
    }),
  ).current;

  if (!rendered) {
    return null;
  }

  return (
    <View
      style={[styles.host, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.card, animatedStyle]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        {...panResponder.panHandlers}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={18}
          color={colors.white}
        />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={18} color={colors.white} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "94%",
    maxWidth: 480,
    backgroundColor: colors.dangerScrim,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: colors.white,
  },
  closeButton: {
    padding: 2,
  },
});
