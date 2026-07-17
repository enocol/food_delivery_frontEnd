import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    likeButton: {
      // minWidth: 34,
      height: 34,
      borderRadius: 17,
      // borderColor: colors.borderLike,
      backgroundColor: colors.bgLike,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      paddingHorizontal: 10,
      gap: 6,
    },
    likeButtonPressed: {
      opacity: 0.85,
      // transform: [{ scale: 0.96 }],
    },
    likeCountText: {
      fontFamily: "Nunito_700Bold",
      fontSize: 14,
      fontWeight: "700",
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
      <View style={styles.likeButton}>
        <Ionicons
          name={hasLikes ? "heart" : "heart-outline"}
          size={20}
          color={hasLikes ? colors.like : colors.textIconMuted}
        />
        {hasLikes ? (
          <Text style={styles.likeCountText}>{Number(likeCount)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
