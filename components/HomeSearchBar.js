import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as colors from "../utils/colors";

const PLACEHOLDER_WORDS = ["restaurants", "Food items"];
const PLACEHOLDER_WORD_HEIGHT = 28;

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
}) {
  const animA = useRef(new Animated.Value(0)).current;
  const animB = useRef(new Animated.Value(PLACEHOLDER_WORD_HEIGHT)).current;
  const placeholderForward = useRef(true);

  useEffect(() => {
    const runCycle = () => {
      const forward = placeholderForward.current;
      const exitAnim = forward ? animA : animB;
      const enterAnim = forward ? animB : animA;

      Animated.parallel([
        Animated.timing(exitAnim, {
          toValue: -PLACEHOLDER_WORD_HEIGHT,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(enterAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        exitAnim.setValue(PLACEHOLDER_WORD_HEIGHT);
        placeholderForward.current = !forward;
      });
    };

    const interval = setInterval(runCycle, 5000);
    return () => clearInterval(interval);
  }, [animA, animB]);

  return (
    <Animated.View
      style={[
        styles.searchBarAnimWrapper,
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
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            autoCapitalize="words"
          />
          {searchQuery.length === 0 && !isSearchFocused && (
            <View pointerEvents="none" style={styles.fakePlaceholder}>
              <Text style={styles.fakePlaceholderStatic}>Search for </Text>
              <View style={styles.fakePlaceholderSlot}>
                <Animated.Text
                  style={[
                    styles.fakePlaceholderWord,
                    {
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
    backgroundColor: colors.black,
  },
  homeSearchWrap: {
    marginBottom: 29,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgWarmAlt,

    borderColor: colors.borderSearchBar,
    height: 50,
    width: "100%",
  },

  searchInputWrapper: {
    flex: 1,
  },
  fakePlaceholder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  fakePlaceholderStatic: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.textSubMuted,
  },
  fakePlaceholderSlot: {
    height: PLACEHOLDER_WORD_HEIGHT,
    overflow: "hidden",
  },
  fakePlaceholderWord: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.textSubMuted,
    height: PLACEHOLDER_WORD_HEIGHT,
    lineHeight: PLACEHOLDER_WORD_HEIGHT,
  },
  homeSearchInput: {
    fontFamily: "Inter_400Regular",
    flex: 1,
    fontSize: 15,
    color: colors.textWarmDark,
    backgroundColor: "transparent",
  },
});
