import React, { useCallback, useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as colors from "../utils/colors";

// The splash owns the screen for HOLD_MS, then cross-fades into the app that
// has been mounting behind it — roughly 3s door to door.
const HOLD_MS = 2600;
const EXIT_MS = 400;

// Matches `imageWidth` of the native splash in app.json, so the handoff from
// the OS splash to this screen has no visible jump in logo size.
const LOGO_SIZE = 220;

// The logo PNG has its own opaque white background, so the rings have to
// start wider than its square or they'd expand out from under it and expose
// the edges.
const RING_SIZE = 300;
const RING_CYCLE_MS = 2400;
const RING_DELAYS = [0, 800, 1600];

const TRACK_WIDTH = 132;

const LOGO_SETTLE_SPRING = { damping: 11, stiffness: 130, mass: 0.9 };

// A delivery-tracking style ping radiating out from behind the logo.
function PulseRing({ delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: RING_CYCLE_MS,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.32,
    transform: [{ scale: 1 + progress.value * 1.6 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.ring, animatedStyle]} />
  );
}

export default function AnimatedSplash({ onFinish, onLayout }) {
  const insets = useSafeAreaInsets();

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
  // Starts at 1 (not 0) so the logo picks up exactly where the native splash
  // left it, then breathes rather than popping in.
  const logoScale = useSharedValue(1);
  const taglineProgress = useSharedValue(0);
  const footerProgress = useSharedValue(0);
  const barProgress = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(
      180,
      withSequence(
        withTiming(1.08, { duration: 420, easing: Easing.out(Easing.cubic) }),
        withSpring(1, LOGO_SETTLE_SPRING),
      ),
    );
    taglineProgress.value = withDelay(
      560,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    footerProgress.value = withDelay(
      760,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
    );
    barProgress.value = withDelay(
      820,
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
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
    logoScale,
    overlayOpacity,
    overlayScale,
    taglineProgress,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
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
      {/* White through the upper half so the logo's own white backdrop is
          invisible against it; the brand tint only warms up the lower edge. */}
      <LinearGradient
        colors={[colors.white, colors.white, colors.bgCream]}
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      />

      <View style={styles.stage}>
        {RING_DELAYS.map((delay) => (
          <PulseRing key={delay} delay={delay} />
        ))}

        <Animated.Image
          source={require("../assets/splash-icon.png")}
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
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -RING_SIZE / 2,
    marginLeft: -RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.dangerText,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: 56,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    letterSpacing: 0.2,
    color: colors.textHeading,
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
    backgroundColor: colors.borderMid,
    overflow: "hidden",
  },
  bar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  caption: {
    marginTop: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
});
