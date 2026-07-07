import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as colors from "../utils/colors";
import { toImageSource } from "../utils/imageSource";
import { formatRestaurantName } from "../utils/formatRestaurantName";
import { formatXaf } from "../utils/formatXaf";
import LikeButton from "./LikeButton";

const RestaurantCard = React.memo(function RestaurantCard({
  item,
  onPress,
  liked = false,
  likeCount = 0,
  onToggleLike,
}) {
  const ratingValue = Number(item.rating) || 0;
  const ratingCount = Number(item.ratingCount) || 0;
  const cuisineText = item.cuisine || "Cuisine unavailable";
  const etaText = item.eta || "Delivery time unavailable";
  const deliveryText =
    Number(item.deliveryFee) > 0
      ? `${formatXaf(Number(item.deliveryFee))} delivery`
      : "Free delivery";

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.restaurantCard}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={toImageSource(item.image)}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {!item.isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Currently Closed</Text>
          </View>
        )}
      </View>
      <View style={styles.restaurantContent}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {formatRestaurantName(item.name)}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={18} color={colors.amberLight} />
          <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
          {ratingCount > 0 && (
            <Text style={styles.ratingCountText}>({ratingCount})</Text>
          )}
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.metaText, styles.cuisineText]} numberOfLines={1}>
            {cuisineText}
          </Text>
        </View>

        <View style={styles.bottomMetaRow}>
          <View style={styles.bottomMetaContent}>
            <View style={styles.metaGroup}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textIconMuted}
              />
              <Text style={styles.metaText}>{etaText}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.metaGroup}>
              <Ionicons
                name="bicycle-outline"
                size={20}
                color={colors.textIconMuted}
              />
              <Text style={styles.metaText}>{deliveryText}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.metaGroup}>
              <Ionicons
                name="bag-handle-outline"
                size={20}
                color={colors.textIconMuted}
              />
              <Text style={styles.metaText}>No min. order</Text>
            </View>
          </View>
          <LikeButton
            liked={liked}
            likeCount={likeCount}
            onPress={() => onToggleLike?.(item.id)}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  restaurantCard: {
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderMid,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    width: "100%",
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 300,
  },
  closedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.overlays.locationBackdrop,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closedBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    fontWeight: "700",
  },
  restaurantContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  restaurantName: {
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    fontWeight: "900",
    color: colors.textRestaurant,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  bottomMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomMetaContent: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
    alignItems: "center",
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    marginLeft: 6,
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "700",
  },
  ratingCountText: {
    marginLeft: 6,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: colors.textMuted,
  },
  dot: {
    marginHorizontal: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: colors.border,
    lineHeight: 18,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: colors.textIconMuted,
  },
  cuisineText: {
    flex: 1,
    flexShrink: 1,
  },
});

export default RestaurantCard;
