import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import styles from "./styles";

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
