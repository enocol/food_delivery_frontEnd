import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { SkeletonBlock } from "../components/LoadingPlaceholder";
import FloatingBasketButton from "../components/FloatingBasketButton";
import {
  useCompactScreen,
  useTransparentHeaderOffset,
} from "../utils/responsive";
import * as colors from "../utils/colors";
import { fetchRestaurantMenu } from "../apis/restaurantApi";
import { formatRestaurantName } from "../utils/formatRestaurantName";

export default function RestaurantDetailsScreen({ route }) {
  const localParams = useLocalSearchParams();
  const rawRestaurantId =
    route?.params?.restaurantId ?? localParams?.restaurantId;
  const restaurantId = Array.isArray(rawRestaurantId)
    ? rawRestaurantId[0]
    : rawRestaurantId;
  const insets = useSafeAreaInsets();
  const isCompactScreen = useCompactScreen();
  const heroBaseHeight = isCompactScreen ? 260 : 380;
  // The hero starts below the transparent header's back-button row rather than
  // behind it, and scrolls up underneath it from there. `0` extra so the image
  // sits flush against the header instead of leaving a gap.
  const headerOffset = useTransparentHeaderOffset(0);
  const modalTopInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 0)
      : insets.top;
  const { addToCart, cartCount, openCartSheet } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Reveal the sticky title just as the hero's bottom edge reaches the header.
  // Derived rather than hardcoded so it tracks the header offset and the
  // shorter hero used on compact screens.
  const stickyRevealStart = headerOffset + heroBaseHeight - 70;
  const stickyRevealEnd = headerOffset + heroBaseHeight - 10;

  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [stickyRevealStart, stickyRevealEnd],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [stickyRevealStart, stickyRevealEnd],
    outputRange: [-20, 0],
    extrapolate: "clamp",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingItemId, setAddingItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [itemSheetImageLoaded, setItemSheetImageLoaded] = useState(false);
  const [menuImageLoadedMap, setMenuImageLoadedMap] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      // The strip behind the status bar is the white page background now that
      // the hero starts below the header, so light icons would be invisible.
      StatusBar.setBarStyle("dark-content");
      StatusBar.setHidden(false);

      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent");
        StatusBar.setTranslucent(true);
      }

      return () => {
        StatusBar.setBarStyle("default");

        if (Platform.OS === "android") {
          StatusBar.setBackgroundColor("transparent");
          StatusBar.setTranslucent(false);
        }
      };
    }, []),
  );

  const handleAddToCart = async (item, quantity = 1) => {
    if (!restaurant || addingItemId) {
      return;
    }
    const qtyToAdd = Math.max(1, Number(quantity) || 1);

    setAddingItemId(String(item.id));
    try {
      await addToCart(item, restaurant, qtyToAdd);
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
    let retryTimeoutId;

    const loadRestaurant = async () => {
      try {
        const data = await fetchRestaurantMenu(restaurantId);
        if (!isActive) {
          return;
        }

        setRestaurant(data.restaurant);
        setError("");
        setLoading(false);
      } catch {
        if (!isActive) {
          return;
        }

        // Keep the shimmer showing and retry in the background instead of
        // surfacing a network/timeout error — the menu should only ever
        // replace the shimmer once the server actually responds. The
        // connectivity banner is handled globally by NetworkStatusProvider,
        // which sees these failures through the shared fetch wrapper.
        retryTimeoutId = setTimeout(loadRestaurant, 3000);
      }
    };

    if (restaurantId) {
      setLoading(true);
      setError("");
      loadRestaurant();
    } else {
      setRestaurant(null);
      setLoading(false);
      setError("Restaurant not found");
    }

    return () => {
      isActive = false;
      clearTimeout(retryTimeoutId);
    };
  }, [restaurantId]);

  useEffect(() => {
    setHeroImageLoaded(false);
    setMenuImageLoadedMap({});
  }, [restaurant?.id]);

  useEffect(() => {
    setItemSheetImageLoaded(false);
    setSelectedItemQty(1);
  }, [selectedItem?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.detailsLoadingContainer,
            { paddingTop: headerOffset },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonBlock
            style={[styles.detailsLoadingHero, { height: heroBaseHeight }]}
          />
          <SkeletonBlock style={styles.detailsLoadingTitle} />
          <SkeletonBlock style={styles.detailsLoadingMeta} />

          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.detailsLoadingMenuCard}>
              <View style={styles.detailsLoadingMenuTextWrap}>
                <SkeletonBlock style={styles.detailsLoadingMenuName} />
                <SkeletonBlock style={styles.detailsLoadingMenuDescription} />
                <SkeletonBlock style={styles.detailsLoadingMenuPrice} />
              </View>
              <SkeletonBlock style={styles.detailsLoadingMenuImage} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
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
    <>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
        {/* Sticky restaurant name bar */}
        <Animated.View
          style={[
            styles.detailsStickyHeader,
            {
              paddingTop: Math.max(insets.top + 12, 12),
              backgroundColor: "rgba(17, 17, 17, 0.55)",
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
          contentContainerStyle={[
            styles.detailsContainer,
            { paddingTop: headerOffset },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          <View
            style={[styles.detailsHeroImageWrap, { height: heroBaseHeight }]}
          >
            <Image
              source={toImageSource(restaurant.image)}
              style={styles.detailsHeroImage}
              onLoad={() => setHeroImageLoaded(true)}
              onError={() => setHeroImageLoaded(true)}
            />
            <LinearGradient
              colors={[
                "rgba(0,0,0,0.24)",
                "rgba(0,0,0,0.06)",
                "rgba(0,0,0,0.16)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.detailsHeroFade}
              pointerEvents="none"
            />
            {!heroImageLoaded ? (
              <SkeletonBlock style={styles.detailsHeroImagePlaceholder} />
            ) : null}
          </View>
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
                  onLoad={() =>
                    setMenuImageLoadedMap((previous) => ({
                      ...previous,
                      [item.id]: true,
                    }))
                  }
                  onError={() =>
                    setMenuImageLoadedMap((previous) => ({
                      ...previous,
                      [item.id]: true,
                    }))
                  }
                />
                {!menuImageLoadedMap[item.id] ? (
                  <SkeletonBlock style={styles.menuImagePlaceholder} />
                ) : null}
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

        <FloatingBasketButton
          count={cartCount}
          onPress={openCartSheet}
          bottom={Math.max(insets.bottom + 16, 16)}
        />

        {/* Menu item detail full-screen modal */}
        <Modal
          visible={!!selectedItem}
          transparent={false}
          animationType="slide"
          statusBarTranslucent={true}
          onRequestClose={() => setSelectedItem(null)}
        >
          <SafeAreaView
            style={styles.itemSheetScreen}
            edges={["left", "right", "bottom"]}
          >
            <View
              style={[styles.itemSheetTopInset, { height: modalTopInset }]}
            />
            {/* Image with close button overlaid top-left */}
            <View style={styles.itemSheetImageWrap}>
              <Image
                source={toImageSource(selectedItem?.image)}
                style={styles.itemSheetImage}
                onLoad={() => setItemSheetImageLoaded(true)}
                onError={() => setItemSheetImageLoaded(true)}
              />
              {!itemSheetImageLoaded ? (
                <SkeletonBlock style={styles.itemSheetImagePlaceholder} />
              ) : null}
              <Pressable
                style={styles.itemSheetClose}
                onPress={() => setSelectedItem(null)}
              >
                <Ionicons name="close" size={22} color={colors.white} />
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

            <View style={styles.itemSheetFooterRow}>
              <View style={styles.itemSheetQtyControl}>
                <Pressable
                  style={[
                    styles.itemSheetQtyButton,
                    (selectedItemQty <= 1 ||
                      addingItemId === String(selectedItem?.id)) &&
                      styles.itemSheetQtyButtonDisabled,
                  ]}
                  onPress={() =>
                    setSelectedItemQty((prev) => Math.max(1, prev - 1))
                  }
                  disabled={
                    selectedItemQty <= 1 ||
                    addingItemId === String(selectedItem?.id)
                  }
                >
                  <Ionicons name="remove" size={18} color={colors.textBody} />
                </Pressable>
                <Text style={styles.itemSheetQtyValue}>{selectedItemQty}</Text>
                <Pressable
                  style={[
                    styles.itemSheetQtyButton,
                    addingItemId === String(selectedItem?.id) &&
                      styles.itemSheetQtyButtonDisabled,
                  ]}
                  onPress={() => setSelectedItemQty((prev) => prev + 1)}
                  disabled={addingItemId === String(selectedItem?.id)}
                >
                  <Ionicons name="add" size={18} color={colors.textBody} />
                </Pressable>
              </View>

              <TouchableOpacity
                style={[
                  styles.itemSheetAddButton,
                  addingItemId === String(selectedItem?.id) &&
                    styles.itemSheetAddButtonBusy,
                ]}
                onPress={() => {
                  handleAddToCart(selectedItem, selectedItemQty);
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
                    : `Add ${selectedItemQty} to Cart`}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    detailsLoadingContainer: {
      paddingBottom: 24,
    },
    detailsLoadingHero: {
      width: "100%",
      height: 380,
      borderRadius: 0,
    },
    detailsLoadingTitle: {
      height: 28,
      marginTop: 16,
      marginHorizontal: 14,
      width: "62%",
    },
    detailsLoadingMeta: {
      height: 16,
      marginTop: 10,
      marginHorizontal: 14,
      width: "42%",
      marginBottom: 12,
    },
    detailsLoadingMenuCard: {
      marginHorizontal: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderMid,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      backgroundColor: colors.white,
    },
    detailsLoadingMenuTextWrap: {
      flex: 1,
    },
    detailsLoadingMenuName: {
      height: 18,
      width: "70%",
      marginBottom: 8,
    },
    detailsLoadingMenuDescription: {
      height: 14,
      width: "92%",
      marginBottom: 8,
    },
    detailsLoadingMenuPrice: {
      height: 16,
      width: "36%",
    },
    detailsLoadingMenuImage: {
      width: 96,
      height: 96,
      borderRadius: 12,
      flexShrink: 0,
    },
    detailsContainer: {
      paddingBottom: 20,
    },
    detailsHeroImageWrap: {
      position: "relative",
      width: "100%",
      height: 380,
      backgroundColor: colors.bgWarm,
      overflow: "hidden",
    },
    detailsHeroImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    detailsHeroFade: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
    },
    detailsHeroImagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 0,
      zIndex: 2,
    },
    detailsStickyHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: "rgba(17, 17, 17, 0.55)",
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.12)",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      backdropFilter: "blur(8px)",
    },
    detailsStickyTitle: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 26,
      color: colors.textHeading,
      marginTop: 14,
      paddingHorizontal: 14,
    },
    detailsMeta: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 14,
      color: colors.white,
      paddingHorizontal: 14,
      marginBottom: 10,
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
    menuImagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 0,
      zIndex: 2,
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 15,
      color: colors.textMenuName,
    },
    menuDescription: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: colors.textMenuMeta,
      marginTop: 4,
    },
    menuPrice: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 14,
      color: colors.success,
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
    itemSheetImagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 0,
      zIndex: 2,
    },
    itemSheetClose: {
      position: "absolute",
      top: 14,
      left: 14,
      zIndex: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.black,
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 20,
      color: colors.textBody,
      flex: 1,
    },
    itemSheetPrice: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 18,
      color: colors.success,
    },
    itemSheetDescription: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 14,
      color: colors.textMenuMeta,
      lineHeight: 20,
    },
    itemSheetFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 18,
      marginBottom: 36,
      marginTop: 10,
    },
    itemSheetQtyControl: {
      minWidth: 110,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderMid,
      backgroundColor: colors.white,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    itemSheetQtyButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgWarm,
    },
    itemSheetQtyButtonDisabled: {
      opacity: 0.45,
    },
    itemSheetQtyValue: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 18,
      color: colors.textBody,
      minWidth: 18,
      textAlign: "center",
    },
    itemSheetAddButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ff5a1f",
      borderRadius: 14,
      paddingVertical: 16,
    },
    itemSheetAddButtonBusy: {
      opacity: 0.6,
    },
    itemSheetAddButtonText: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 16,
      color: colors.white,
    },
  }),
};
