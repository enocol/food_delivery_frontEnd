import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    // The reference card sets the heart bare against the white content area
    // rather than inside a tinted pill, so the container is now just a tap
    // target. Sized to stay above the accessibility minimum.
    likeButton: {
      minWidth: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    likeButtonPressed: {
      opacity: 0.6,
    },
    likeButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    likeCountText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: colors.textDark,
    },
  }),
};

export default function LikeButton({ liked = false, likeCount = 0, onPress }) {
  const hasLikes = Number(likeCount) >= 1;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.likeButton,
        pressed ? styles.likeButtonPressed : null,
      ]}
      onPress={(event) => {
        event.stopPropagation?.();
        onPress?.();
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={liked ? "Unlike restaurant" : "Like restaurant"}
      accessibilityState={{ selected: liked }}
    >
      <View style={styles.likeButtonInner}>
        <Ionicons
          name={hasLikes ? "heart" : "heart-outline"}
          size={22}
          color={hasLikes ? colors.like : colors.textIconMuted}
        />
        {hasLikes ? (
          <Text style={styles.likeCountText}>{Number(likeCount)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
