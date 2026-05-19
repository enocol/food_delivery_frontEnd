import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import sharedStyles from "./styles";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    likeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#e6d4bf",
      backgroundColor: "#fff5ea",
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
        color={liked ? "#e11d48" : "#5a5249"}
      />
    </Pressable>
  );
}
