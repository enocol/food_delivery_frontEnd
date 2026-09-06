import React, { useCallback, useEffect, useRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as colors from "../utils/colors";

// The splash owns the screen for HOLD_MS, then cross-fades into the app that
// has been mounting behind it — roughly 3s door to door.
const HOLD_MS = 2600;
const EXIT_MS = 400;

// Matches `imageWidth` of the native splash in app.json, so the logo is the
// same size here as on the OS splash it hands off from.
const LOGO_SIZE = 220;

// Extra margin (beyond half the screen width) so the logo's starting position
// is guaranteed fully off-screen, not just tucked behind the edge.
const LOGO_OFFSCREEN_MARGIN = 40;

const TRACK_WIDTH = 132;

const LOGO_SETTLE_SPRING = { damping: 11, stiffness: 130, mass: 0.9 };

export default function AnimatedSplash({ onFinish, onLayout }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const logoOffscreenX = -(screenWidth / 2 + LOGO_SIZE / 2 + LOGO_OFFSCREEN_MARGIN);

  // Kept in a ref so a re-render of the parent can never restart the sequence
  // partway through.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finish = useCallback(() => {
    if (onFinishRef.current) {
      onFinishRef.current();
    }
  }, []);

  const overlayOpacity = useSharedValue(1);
  const overlayScale = useSharedValue(1);
  const logoTranslateX = useSharedValue(logoOffscreenX);
  const taglineProgress = useSharedValue(0);
  const footerProgress = useSharedValue(0);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    // Tagline animates in first with the logo still fully off-screen; the
    // logo only starts its slide once the tagline has settled.
    taglineProgress.value = withDelay(
      150,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
    logoTranslateX.value = withDelay(650, withSpring(0, LOGO_SETTLE_SPRING));
    footerProgress.value = withDelay(
      950,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    barProgress.value = withDelay(
      1000,
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
    );

    const exitTimer = setTimeout(() => {
      overlayScale.value = withTiming(1.06, {
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
      });
      overlayOpacity.value = withTiming(
        0,
        { duration: EXIT_MS, easing: Easing.in(Easing.quad) },
        (completed) => {
          if (completed) {
            runOnJS(finish)();
          }
        },
      );
    }, HOLD_MS);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [
    barProgress,
    finish,
    footerProgress,
    logoTranslateX,
    overlayOpacity,
    overlayScale,
    taglineProgress,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: logoTranslateX.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineProgress.value,
    transform: [{ translateY: (1 - taglineProgress.value) * 14 }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerProgress.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: 6 + barProgress.value * (TRACK_WIDTH - 6),
  }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Mbolo Eats is starting"
      onLayout={onLayout}
      style={[styles.overlay, overlayStyle]}
    >
      <View style={styles.stage}>
        <Animated.Image
          source={require("../assets/splash-logo-orange.png")}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Fresh food, delivered fast
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.footer,
          footerStyle,
          { paddingBottom: insets.bottom + 48 },
        ]}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <Text style={styles.caption}>Delivering across Cameroon</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    // Matches the native splash's backgroundColor (app.json) exactly, so
    // there is no color shift when the OS splash hands off to this one.
    backgroundColor: "#ff5a1f",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    letterSpacing: 0.2,
    color: colors.white,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  track: {
    width: TRACK_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden",
  },
  bar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  caption: {
    marginTop: 14,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textHeading,
  },
});
