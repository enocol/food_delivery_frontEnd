import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as colors from "../utils/colors";

const PLACEHOLDER_WORDS = ["restaurants", "Food items"];
const PLACEHOLDER_WORD_HEIGHT = 24;

function getWordOpacity(animatedValue) {
  return animatedValue.interpolate({
    inputRange: [-PLACEHOLDER_WORD_HEIGHT, -1, 0, 1, PLACEHOLDER_WORD_HEIGHT],
    outputRange: [0, 0, 1, 0, 0],
    extrapolate: "clamp",
  });
}

export default function HomeSearchBar({
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  searchBarAnim,
  onSearchInputFocus,
  containerStyle,
}) {
  const animA = useRef(new Animated.Value(0)).current;
  const animB = useRef(new Animated.Value(PLACEHOLDER_WORD_HEIGHT)).current;
  const placeholderForward = useRef(true);
  const activePlaceholderAnimationRef = useRef(null);
  const adaptiveTextSize = Math.max(
    12,
    Math.min(14, 14 / (1 + (PixelRatio.getFontScale() - 1) * 0.6)),
  );

  useEffect(() => {
    const runCycle = () => {
      const forward = placeholderForward.current;
      const exitAnim = forward ? animA : animB;
      const enterAnim = forward ? animB : animA;

      activePlaceholderAnimationRef.current?.stop?.();

      const nextAnimation = Animated.parallel([
        Animated.timing(exitAnim, {
          toValue: -PLACEHOLDER_WORD_HEIGHT,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(enterAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);

      activePlaceholderAnimationRef.current = nextAnimation;

      nextAnimation.start(() => {
        exitAnim.setValue(PLACEHOLDER_WORD_HEIGHT);
        placeholderForward.current = !forward;
      });
    };

    const interval = setInterval(runCycle, 5000);
    return () => {
      clearInterval(interval);
      activePlaceholderAnimationRef.current?.stop?.();
      animA.stopAnimation();
      animB.stopAnimation();
    };
  }, [animA, animB]);

  return (
    <Animated.View
      style={[
        styles.searchBarAnimWrapper,
        containerStyle,
        {
          maxHeight: searchBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 70],
          }),
          opacity: searchBarAnim,
        },
      ]}
    >
      <View
        style={[
          styles.homeSearchWrap,
          isSearchFocused && { borderColor: colors.black },
        ]}
      >
        <Ionicons name="search" size={24} color={colors.amberLight} />
        <View style={styles.searchInputWrapper}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder=""
            placeholderTextColor={colors.textSubMuted}
            style={styles.homeSearchInput}
            onFocus={() => {
              setIsSearchFocused(true);
              onSearchInputFocus?.();
            }}
            onBlur={() => setIsSearchFocused(false)}
            autoCapitalize="words"
          />
          {searchQuery.length === 0 && !isSearchFocused && (
            <View pointerEvents="none" style={styles.fakePlaceholder}>
              <Text
                style={[
                  styles.fakePlaceholderStatic,
                  { fontSize: adaptiveTextSize },
                ]}
              >
                Search for
              </Text>
              <View style={styles.fakePlaceholderSlot}>
                <Animated.Text
                  style={[
                    styles.fakePlaceholderWord,
                    {
                      fontSize: adaptiveTextSize,
                      transform: [{ translateY: animA }],
                      opacity: getWordOpacity(animA),
                    },
                  ]}
                >
                  {PLACEHOLDER_WORDS[0]}
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.fakePlaceholderWord,
                    { position: "absolute", top: 0 },
                    {
                      fontSize: adaptiveTextSize,
                      transform: [{ translateY: animB }],
                      opacity: getWordOpacity(animB),
                    },
                  ]}
                >
                  {PLACEHOLDER_WORDS[1]}
                </Animated.Text>
              </View>
            </View>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSubMuted}
            />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchBarAnimWrapper: {
    overflow: "hidden",
    backgroundColor: colors.white,
    width: "70%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 15,
  },
  homeSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgWarm,
    borderRadius: 10,
    height: 50,
    width: "100%",
    paddingHorizontal: 10,
  },

  searchInputWrapper: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  fakePlaceholder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minWidth: 0,
    paddingRight: 8,
  },
  fakePlaceholderStatic: {
    fontFamily: "Inter_400Regular",
    color: colors.textSubMuted,
    flexShrink: 0,
    includeFontPadding: false,
  },
  fakePlaceholderSlot: {
    height: PLACEHOLDER_WORD_HEIGHT,
    overflow: "hidden",
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
  },
  // This is the animated placeholder word that will fade in and out
  fakePlaceholderWord: {
    fontFamily: "Inter_400Regular",
    color: colors.textSubMuted,
    height: PLACEHOLDER_WORD_HEIGHT,
    lineHeight: PLACEHOLDER_WORD_HEIGHT,
    width: "100%",
    minWidth: 0,
    includeFontPadding: false,
  },
  homeSearchInput: {
    fontFamily: "Inter_400Regular",
    flex: 1,
    color: colors.textWarmDark,
    backgroundColor: "transparent",
    width: "100%",
    paddingVertical: 0,
    includeFontPadding: false,
  },
});
