import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";
import { fetchRestaurantMenu } from "../apis/restaurantApi";
import { formatRestaurantName } from "../utils/formatRestaurantName";

export default function RestaurantDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const modalTopInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 0)
      : insets.top;
  const { addToCart, cartCount, openCartSheet } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [310, 370],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [310, 370],
    outputRange: [-20, 0],
    extrapolate: "clamp",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingItemId, setAddingItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAddToCart = async (item) => {
    if (!restaurant || addingItemId) {
      return;
    }

    setAddingItemId(String(item.id));
    try {
      await addToCart(item, restaurant);
    } catch (addError) {
      Alert.alert(
        "Could not add item",
        addError?.message || "Please try again.",
      );
    } finally {
      setAddingItemId(null);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadRestaurant = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchRestaurantMenu(route.params?.restaurantId);
        if (!isActive) {
          return;
        }

        setRestaurant(data.restaurant);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setRestaurant(null);
        setError(loadError.message || "Failed to load restaurant");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (route.params?.restaurantId) {
      loadRestaurant();
    } else {
      setRestaurant(null);
      setLoading(false);
      setError("Restaurant not found");
    }

    return () => {
      isActive = false;
    };
  }, [route.params?.restaurantId]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.emptyTitle}>Loading restaurant...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.emptyTitle}>Restaurant not found.</Text>
        <Text style={styles.emptySub}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Sticky restaurant name bar */}
      <Animated.View
        style={[
          styles.detailsStickyHeader,
          {
            opacity: stickyHeaderOpacity,
            transform: [{ translateY: stickyHeaderTranslateY }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.detailsStickyTitle} numberOfLines={1}>
          {formatRestaurantName(restaurant.name)}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <Image
          source={toImageSource(restaurant.image)}
          style={styles.detailsHeroImage}
        />
        <Text style={styles.detailsTitle}>
          {formatRestaurantName(restaurant.name)}
        </Text>
        <Text style={styles.detailsMeta}>
          {restaurant.cuisine} • {restaurant.eta}
        </Text>

        {restaurant.menu.map((item) => (
          <Pressable
            key={item.id}
            style={styles.menuCard}
            onPress={() => setSelectedItem(item)}
          >
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuName}>
                {formatRestaurantName(item.name)}
              </Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
              <Text style={styles.menuPrice}>{formatXaf(item.price)}</Text>
            </View>
            <View style={styles.menuImageContainer}>
              <Image
                source={toImageSource(item.image)}
                style={styles.menuImage}
              />
              <TouchableOpacity
                style={styles.menuPlusButton}
                onPress={() => handleAddToCart(item)}
                disabled={addingItemId === String(item.id)}
              >
                <Ionicons
                  name={
                    addingItemId === String(item.id) ? "time-outline" : "add"
                  }
                  size={20}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}
      </Animated.ScrollView>

      {cartCount > 0 ? (
        <Pressable
          style={[
            styles.viewBasketButton,
            { bottom: Math.max(insets.bottom + 16, 16) },
          ]}
          onPress={openCartSheet}
        >
          <Ionicons name="cart-outline" size={18} color={colors.white} />
          <Text style={styles.viewBasketText}>View Basket</Text>
          <View style={styles.viewBasketBadge}>
            <Text style={styles.viewBasketBadgeText}>{cartCount}</Text>
          </View>
        </Pressable>
      ) : null}

      {/* Menu item detail full-screen modal */}
      <Modal
        visible={!!selectedItem}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={false}
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView
          style={styles.itemSheetScreen}
          edges={["left", "right", "bottom"]}
        >
          <View style={[styles.itemSheetTopInset, { height: modalTopInset }]} />
          {/* Image with close button overlaid top-left */}
          <View style={styles.itemSheetImageWrap}>
            <Image
              source={toImageSource(selectedItem?.image)}
              style={styles.itemSheetImage}
            />
            <Pressable
              style={styles.itemSheetClose}
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={22} color={colors.textWarmDark} />
            </Pressable>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.itemSheetBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemSheetNameRow}>
              <Text style={styles.itemSheetName}>{selectedItem?.name}</Text>
              <Text style={styles.itemSheetPrice}>
                {formatXaf(selectedItem?.price)}
              </Text>
            </View>
            <View style={styles.itemSheetDivider} />
            <Text style={styles.itemSheetDescription}>
              {selectedItem?.description}
            </Text>
          </ScrollView>

          {/* Add to cart button pinned at bottom */}
          <TouchableOpacity
            style={[
              styles.itemSheetAddButton,
              addingItemId === String(selectedItem?.id) &&
                styles.itemSheetAddButtonBusy,
            ]}
            onPress={() => {
              handleAddToCart(selectedItem);
              setSelectedItem(null);
            }}
            disabled={addingItemId === String(selectedItem?.id)}
          >
            <Ionicons
              name={
                addingItemId === String(selectedItem?.id)
                  ? "time-outline"
                  : "cart-outline"
              }
              size={20}
              color={colors.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.itemSheetAddButtonText}>
              {addingItemId === String(selectedItem?.id)
                ? "Adding..."
                : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    detailsContainer: {
      paddingBottom: 20,
    },
    detailsStickyHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: colors.bgWarm,
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMid,
    },
    detailsStickyTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 17,
      color: colors.textBody,
      textAlign: "center",
    },
    detailsTopControls: {
      position: "relative",
      top: 50,
      left: 12,
      zIndex: 10,
    },
    detailsBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.overlays.backButtonBg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    detailsTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 26,
      fontWeight: "900",
      color: colors.textBody,
      marginTop: 14,
      paddingHorizontal: 14,
    },
    detailsMeta: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.textMid,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    viewBasketButton: {
      position: "absolute",
      left: "30%",
      right: "30%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.primary,
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 30,
    },
    viewBasketBadge: {
      position: "absolute",
      top: -7,
      right: -7,
      minWidth: 22,
      height: 22,
      paddingHorizontal: 5,
      borderRadius: 11,
      backgroundColor: colors.amber,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.white,
    },
    viewBasketBadgeText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 11,
      fontWeight: "800",
      color: colors.textWarmDark,
    },
    viewBasketText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 15,
      fontWeight: "800",
      color: colors.white,
    },
    menuCard: {
      backgroundColor: colors.white,
      marginHorizontal: 14,
      marginTop: 10,
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderMid,
    },
    menuImage: {
      width: 100,
      height: 100,
    },
    menuImageContainer: {
      position: "relative",
      width: 100,
      height: 100,
    },
    menuPlusButton: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: colors.black,
      borderRadius: 16,
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    menuTextWrap: {
      flex: 1,
      paddingHorizontal: 10,
    },
    menuName: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 15,
      fontWeight: "800",
      color: colors.textMenuName,
    },
    menuDescription: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textMenuMeta,
      marginTop: 4,
    },
    menuPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 14,
      color: colors.success,
      fontWeight: "700",
      marginTop: 6,
    },
    itemSheetScreen: {
      flex: 1,
      backgroundColor: colors.bgWarm,
      // paddingTop: 20,
    },
    itemSheetTopInset: {
      width: "100%",
      backgroundColor: colors.bgWarm,
    },
    itemSheetImageWrap: {
      position: "relative",
      width: "100%",
      height: 300,
    },
    itemSheetImage: {
      width: "100%",
      height: 300,
      objectFit: "cover",
    },
    itemSheetClose: {
      position: "absolute",
      top: 14,
      left: 14,
      zIndex: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.overlays.closeButtonBg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    itemSheetBody: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 16,
    },
    itemSheetNameRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 12,
    },
    itemSheetDivider: {
      height: 1,
      backgroundColor: colors.borderMid,
      marginBottom: 14,
    },
    itemSheetName: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 20,
      fontWeight: "800",
      color: colors.textBody,
      flex: 1,
    },
    itemSheetPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 18,
      fontWeight: "700",
      color: colors.success,
    },
    itemSheetDescription: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.textMenuMeta,
      lineHeight: 20,
    },
    itemSheetAddButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      marginHorizontal: 18,
      marginBottom: 36,
      marginTop: 10,
      borderRadius: 14,
      paddingVertical: 16,
    },
    itemSheetAddButtonBusy: {
      opacity: 0.6,
    },
    itemSheetAddButtonText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 16,
      fontWeight: "800",
      color: colors.white,
    },
  }),
};
