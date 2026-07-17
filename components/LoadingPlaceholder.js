import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as colors from "../utils/colors";

export function SkeletonBlock({ style, shimmer = true }) {
  const shimmerProgress = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!shimmer) {
      return;
    }

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
      shimmerProgress.setValue(-1);
    };
  }, [shimmer, shimmerProgress]);

  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [-1, 1],
    outputRange: [-240, 240],
  });

  return (
    <View style={[styles.block, style]}>
      {shimmer ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmerTrack,
            {
              transform: [
                { translateX: shimmerTranslateX },
                { rotate: "16deg" },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.42)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.borderMid,
    borderRadius: 10,
    overflow: "hidden",
  },
  shimmerTrack: {
    ...StyleSheet.absoluteFillObject,
    width: "58%",
    left: "-20%",
  },
  shimmerGradient: {
    flex: 1,
  },
});
