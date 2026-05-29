import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    likeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.borderLike,
      backgroundColor: colors.bgLike,
      alignItems: "center",
      justifyContent: "center",
    },
    likeButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
  }),
};

export default function LikeButton({ liked = false, onPress }) {
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
      <Ionicons
        name={liked ? "heart" : "heart-outline"}
        size={20}
        color={liked ? colors.like : colors.textIconMuted}
      />
    </Pressable>
  );
}
