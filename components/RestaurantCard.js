import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import sharedStyles from "./styles";
import LikeButton from "./LikeButton";
import * as colors from "../utils/colors";
import { toImageSource } from "../utils/imageSource";
import { formatRestaurantName } from "../utils/formatRestaurantName";

const RestaurantCard = React.memo(function RestaurantCard({
  item,
  onPress,
  liked,
  onToggleLike,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.restaurantCard}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={toImageSource(item.image)}
          style={sharedStyles.detailsHeroImage}
          resizeMode="contain"
        />
        {!item.isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Currently Closed</Text>
          </View>
        )}
      </View>
      <View style={styles.restaurantContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.restaurantName}>
            {formatRestaurantName(item.name)}
          </Text>
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <Text style={sharedStyles.metaText}>{item.cuisine}</Text>
        <View style={styles.restaurantMetaRow}>
          <Text style={sharedStyles.metaText}>{item.eta}</Text>
          <LikeButton liked={liked} onPress={() => onToggleLike(item.id)} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  restaurantCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOrange,
    elevation: 3,
    width: "100%",
  },
  imageWrapper: {
    position: "relative",
  },
  closedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "red",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closedBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
    fontWeight: "700",
  },
  restaurantContent: {
    padding: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  restaurantName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 18,
    fontWeight: "800",
    color: colors.textRestaurant,
    flex: 1,
  },
  rating: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: colors.amberDark,
    fontWeight: "700",
  },
  restaurantMetaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default RestaurantCard;
