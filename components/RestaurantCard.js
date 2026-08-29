import React, { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as colors from "../utils/colors";
import { toImageSource } from "../utils/imageSource";
import { formatRestaurantName } from "../utils/formatRestaurantName";
import { formatXaf } from "../utils/formatXaf";
import LikeButton from "./LikeButton";
import { SkeletonBlock } from "./LoadingPlaceholder";
import { CARD_MAX_WIDTH } from "../utils/responsive";

// The hero takes each image's own proportions once it loads, so the picture
// spans the full card width AND is never cropped. Any fixed frame has to give
// up one of those two: it either crops to fill (cover) or leaves bands on
// whichever axis does not match (contain).
//
// FALLBACK is the shape used until the image reports its size - close to the
// square-ish images in use, so the card barely moves when it resolves.
// The clamps only catch freak uploads; within them the frame matches the image
// exactly, so nothing is cropped and nothing is banded.
const FALLBACK_ASPECT = 1.05;
const MIN_ASPECT = 0.7;
const MAX_ASPECT = 2.5;

const RestaurantCard = React.memo(function RestaurantCard({
  item,
  onPress,
  liked = false,
  likeCount = 0,
  onToggleLike,
  // Liking needs an account, so the control is hidden entirely for guests
  // rather than shown and then rejected on tap.
  showLike = true,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [heroAspect, setHeroAspect] = useState(FALLBACK_ASPECT);

  useEffect(() => {
    setImageLoaded(false);
    setHeroAspect(FALLBACK_ASPECT);
  }, [item.image]);

  const handleHeroLoad = (event) => {
    // Remote sources report their intrinsic size here on both platforms, and
    // toImageSource resolves local requires to a uri, so every source shape the
    // card is given arrives this way.
    const { width, height } = event?.nativeEvent?.source || {};
    if (width > 0 && height > 0) {
      setHeroAspect(Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, width / height)));
    }
    setImageLoaded(true);
  };

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
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress(item.id);
      }}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={toImageSource(item.image)}
          style={[styles.heroImage]}
          // Once the frame matches the image, contain and cover render the
          // same. contain is the safe choice for the clamped extremes: it keeps
          // a freak image whole rather than slicing its edges off.
          resizeMode="cover"
          onLoad={handleHeroLoad}
          onError={() => setImageLoaded(true)}
        />
        {!imageLoaded ? (
          <SkeletonBlock style={styles.heroImagePlaceholder} />
        ) : null}
        {!item.isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Currently Closed</Text>
          </View>
        )}
      </View>

      <View style={styles.restaurantContent}>
        {/* Name and heart share a row, the way the reference card sets them. */}
        <View style={styles.titleRow}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {formatRestaurantName(item.name)}
          </Text>
          {showLike ? (
            <LikeButton
              liked={liked}
              likeCount={likeCount}
              onPress={() => onToggleLike?.(item.id)}
            />
          ) : null}
        </View>

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

        {/* The reference fits these three on one line; this copy is longer in
            French/XAF, so the row still wraps rather than truncating. */}
        <View style={styles.metaRowWrap}>
          <View style={styles.metaGroup}>
            <Ionicons
              name="time-outline"
              size={17}
              color={colors.textIconMuted}
            />
            <Text style={styles.metaText}>{etaText}</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <View style={styles.metaGroup}>
            <Ionicons
              name="bicycle-outline"
              size={17}
              color={colors.textIconMuted}
            />
            <Text style={styles.metaText}>{deliveryText}</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <View style={styles.metaGroup}>
            <Ionicons
              name="bag-handle-outline"
              size={17}
              color={colors.textIconMuted}
            />
            <Text style={styles.metaText}>No min. order</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  restaurantCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderMid,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: "center",
    overflow: "hidden",
    marginVertical: 20,
  },
  imageWrapper: {
    position: "relative",
    // The band colour beside or above a contained image, the backdrop for
    // transparent logo PNGs, and what shows while the image loads.
    backgroundColor: colors.white,
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    zIndex: 2,
  },
  heroImage: {
    width: "100%",
    // Height comes from the aspectRatio applied inline - see handleHeroLoad.
    height: 265,
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
    fontFamily: "Poppins_700Bold",
  },
  restaurantContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  restaurantName: {
    flex: 1,
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors.textRestaurant,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  metaRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 6,
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingText: {
    marginLeft: 6,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.textDark,
  },
  ratingCountText: {
    marginLeft: 5,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: colors.textMuted,
  },
  dot: {
    marginHorizontal: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 18,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: colors.textIconMuted,
  },
  cuisineText: {
    flex: 1,
    flexShrink: 1,
  },
});

export default RestaurantCard;
