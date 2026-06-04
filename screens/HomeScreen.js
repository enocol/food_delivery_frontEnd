import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";
import { fetchRestaurantMenu, fetchRestaurants } from "../apis/restaurantApi";
import { fetchLikes, likeRestaurant, unlikeRestaurant } from "../apis/likesApi";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import { FOOD_FILTERS, FILTER_ALIASES } from "../data/foodFilters";
import RestaurantCard from "../components/RestaurantCard";

const PLACEHOLDER_WORDS = ["restaurants", "Food"];
const PLACEHOLDER_WORD_HEIGHT = 28;

function getFilterTerms(food) {
  return Array.from(new Set([food, ...(FILTER_ALIASES[food] || [])]))
    .map((term) =>
      String(term || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

function menuItemMatchesFilter(menuItem, terms) {
  const text = `${menuItem?.name || ""} ${menuItem?.description || ""}`
    .trim()
    .toLowerCase();

  if (!text) {
    return false;
  }

  return terms.some((term) => text.includes(term));
}

function restaurantMatchesQuery(restaurant, query) {
  const text = `${restaurant?.name || ""} ${restaurant?.cuisine || ""}`
    .trim()
    .toLowerCase();

  if (!text || !query) {
    return false;
  }

  return text.includes(query);
}

export default function HomeScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const { firebaseUid } = useAuth();
  const [selectedFood, setSelectedFood] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [error, setError] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(
    "Fetching location...",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isClosedModalVisible, setIsClosedModalVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [likedRestaurantIds, setLikedRestaurantIds] = useState(() => ({}));
  const animA = useRef(new Animated.Value(0)).current;
  const animB = useRef(new Animated.Value(PLACEHOLDER_WORD_HEIGHT)).current;
  const placeholderForward = useRef(true);
  const searchBarAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const searchBarVisible = useRef(true);

  useEffect(() => {
    const runCycle = () => {
      const forward = placeholderForward.current;
      const exitAnim = forward ? animA : animB;
      const enterAnim = forward ? animB : animA;

      Animated.parallel([
        Animated.timing(exitAnim, {
          toValue: -PLACEHOLDER_WORD_HEIGHT,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(enterAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        exitAnim.setValue(PLACEHOLDER_WORD_HEIGHT);
        placeholderForward.current = !forward;
      });
    };

    const interval = setInterval(runCycle, 5000);
    return () => clearInterval(interval);
  }, [animA, animB]);

  // Seed liked state from the server whenever a user is authenticated.
  useEffect(() => {
    if (!firebaseUid) {
      setLikedRestaurantIds({});
      return;
    }

    let isActive = true;

    fetchLikes(firebaseUid)
      .then((rows) => {
        if (!isActive) return;
        const map = {};
        rows.forEach((row) => {
          map[row.restaurantId] = true;
        });
        setLikedRestaurantIds(map);
      })
      .catch((error) =>
        console.warn("[LikeButton] failed to load likes", error),
      );

    return () => {
      isActive = false;
    };
  }, [firebaseUid]);

  const renderHeaderLocation = useCallback(
    () => (
      <Pressable
        onPress={() => setIsLocationModalVisible(true)}
        style={styles.homeHeaderLocationWrap}
      >
        <Text style={styles.homeHeaderLocationLabel}>Delivery to:</Text>
        <View style={styles.homeHeaderLocationRow}>
          <Ionicons name="location" size={20} color={colors.primaryDeep} />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {deliveryLocation}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primaryDeep} />
        </View>
      </Pressable>
    ),
    [deliveryLocation],
  );

  useRootCartHeader(navigation, cartCount, "", openCartSheet, {
    headerHeight: 130,
    headerBackgroundColor: colors.bgWarm,
    headerLeft: renderHeaderLocation,
    headerLeftContainerStyle: styles.homeHeaderLocationContainer,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    let isActive = true;

    const loadDeliveryLocation = async () => {
      try {
        const coords = await getCurrentLocation();
        const address = await getLocationAddress(
          coords.latitude,
          coords.longitude,
        );

        if (!isActive) {
          return;
        }

        const locationText = [
          address?.name,
          address?.street,
          address?.city,
          address?.region,
        ]
          .filter(Boolean)
          .join(", ");

        setDeliveryLocation(locationText || "Current location");
      } catch (locationError) {
        if (!isActive) {
          return;
        }

        setDeliveryLocation("Location unavailable");
      }
    };

    loadDeliveryLocation();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRestaurants = async () => {
      setIsLoading(true);
      setError("");

      try {
        const activeFilter =
          selectedFood && selectedFood !== "All" ? selectedFood : null;
        const query = debouncedSearchQuery.trim().toLowerCase();
        const allRestaurants = await fetchRestaurants();
        const selectedMenuTerms = activeFilter
          ? getFilterTerms(activeFilter)
          : [];
        const queryTerms = query ? [query] : [];
        const needsMenuLookup = Boolean(activeFilter || query);

        let menuResponses = [];

        if (needsMenuLookup) {
          menuResponses = await Promise.allSettled(
            allRestaurants.map((restaurant) =>
              fetchRestaurantMenu(restaurant.id),
            ),
          );
        }

        const data = allRestaurants.filter((restaurant, index) => {
          const menuResponse = menuResponses[index];
          const menuItems =
            menuResponse?.status === "fulfilled"
              ? menuResponse.value?.menu || []
              : [];

          const matchesSelectedMenu =
            !activeFilter ||
            menuItems.some((menuItem) =>
              menuItemMatchesFilter(menuItem, selectedMenuTerms),
            );

          const matchesQuery =
            !query ||
            restaurantMatchesQuery(restaurant, query) ||
            menuItems.some((menuItem) =>
              menuItemMatchesFilter(menuItem, queryTerms),
            );

          return matchesSelectedMenu && matchesQuery;
        });

        if (!isActive) {
          return;
        }

        setRestaurants(data);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setRestaurants([]);
        setError(loadError.message || "Failed to load restaurants");
      } finally {
        if (isActive) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      isActive = false;
    };
  }, [selectedFood, debouncedSearchQuery, refreshNonce]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshNonce((value) => value + 1);
  }, []);

  const handleScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (diff > 8 && searchBarVisible.current) {
        searchBarVisible.current = false;
        Animated.timing(searchBarAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else if (diff < -8 && !searchBarVisible.current) {
        searchBarVisible.current = true;
        Animated.timing(searchBarAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
    [searchBarAnim],
  );

  // Always restore the search bar when the user is actively using it.
  useEffect(() => {
    if (isSearchFocused || searchQuery.length > 0) {
      searchBarVisible.current = true;
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isSearchFocused, searchQuery, searchBarAnim]);

  const handleOpenRestaurant = useCallback(
    (restaurantId) => {
      const restaurant = restaurants.find((r) => r.id === restaurantId);
      if (restaurant && !restaurant.isOpen) {
        setIsClosedModalVisible(true);
        return;
      }
      navigation.getParent()?.navigate("RestaurantDetails", { restaurantId });
    },
    [navigation, restaurants],
  );

  const handleToggleLike = useCallback(
    (restaurantId) => {
      setLikedRestaurantIds((previous) => {
        const isCurrentlyLiked = Boolean(previous[restaurantId]);
        if (isCurrentlyLiked) {
          unlikeRestaurant(firebaseUid, restaurantId).catch((error) =>
            console.warn("[LikeButton] unlike failed", error),
          );
        } else {
          likeRestaurant(firebaseUid, restaurantId).catch((error) =>
            console.warn("[LikeButton] like failed", error),
          );
        }
        return { ...previous, [restaurantId]: !isCurrentlyLiked };
      });
    },
    [firebaseUid],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const renderRestaurantItem = useCallback(
    ({ item }) => (
      <RestaurantCard
        item={item}
        onPress={handleOpenRestaurant}
        liked={Boolean(likedRestaurantIds[item.id])}
        onToggleLike={handleToggleLike}
      />
    ),
    [handleOpenRestaurant, handleToggleLike, likedRestaurantIds],
  );

  let emptyStateIconName = "restaurant-outline";
  let emptyStateIconColor = colors.orange;
  let emptyStateIconBackgroundColor = colors.bgEmptyOrange;
  let emptyStateIconBorderColor = colors.borderOrange;

  if (isLoading) {
    emptyStateIconName = "time-outline";
    emptyStateIconColor = colors.amber;
    emptyStateIconBackgroundColor = colors.bgEmptyAmber;
    emptyStateIconBorderColor = colors.borderEmptyAmber;
  } else if (error) {
    emptyStateIconName = "alert-circle-outline";
    emptyStateIconColor = colors.danger;
    emptyStateIconBackgroundColor = colors.bgEmptyDanger;
    emptyStateIconBorderColor = colors.borderEmptyDanger;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.gradientBackground}>
        <Modal
          visible={isClosedModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsClosedModalVisible(false)}
        >
          <View style={styles.closedModalBackdrop}>
            <View style={styles.closedModalCard}>
              <Text style={styles.closedModalTitle}>Restaurant Closed</Text>
              <Text style={styles.closedModalMessage}>
                You cannot make an order. Restaurant is currently closed.
              </Text>
              <Pressable
                style={styles.closedModalButton}
                onPress={() => setIsClosedModalVisible(false)}
              >
                <Text style={styles.closedModalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isLocationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLocationModalVisible(false)}
        >
          <Pressable
            style={styles.homeLocationModalBackdrop}
            onPress={() => setIsLocationModalVisible(false)}
          >
            <Pressable style={styles.homeLocationModalCard} onPress={() => {}}>
              <View style={styles.homeLocationModalHeader}>
                <Text style={styles.homeLocationModalTitle}>
                  Delivery location
                </Text>
                <Pressable
                  onPress={() => setIsLocationModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.textDark} />
                </Pressable>
              </View>

              <View style={styles.homeLocationModalRow}>
                <Ionicons name="location" size={18} color={colors.orange} />
                <Text style={styles.homeLocationModalText}>
                  {deliveryLocation}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={styles.foodFilterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foodFilterScrollContent}
          >
            {FOOD_FILTERS.map((food) => {
              const isActive = selectedFood === food;
              return (
                <View key={food} style={styles.foodFilterItem}>
                  <Pressable
                    onPress={() =>
                      setSelectedFood((prev) => {
                        if (food === "All") {
                          return "All";
                        }

                        return prev === food ? "All" : food;
                      })
                    }
                    style={[
                      styles.foodFilterChip,
                      isActive ? styles.foodFilterChipActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.foodFilterChipText,
                        isActive ? styles.foodFilterChipTextActive : null,
                      ]}
                    >
                      {food}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Animated.View
          style={[
            styles.searchBarAnimWrapper,
            {
              maxHeight: searchBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 70],
              }),
              opacity: searchBarAnim,
            },
          ]}
        >
          <View
            style={[
              styles.homeSearchWrap,
              isSearchFocused && { borderColor: colors.black },
            ]}
          >
            <Ionicons name="search" size={24} color={colors.amberLight} />
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder=""
                placeholderTextColor={colors.textSubMuted}
                style={styles.homeSearchInput}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoCapitalize="words"
              />
              {searchQuery.length === 0 && !isSearchFocused && (
                <View pointerEvents="none" style={styles.fakePlaceholder}>
                  <Text style={styles.fakePlaceholderStatic}>looking for </Text>
                  <View style={styles.fakePlaceholderSlot}>
                    <Animated.Text
                      style={[
                        styles.fakePlaceholderWord,
                        { transform: [{ translateY: animA }] },
                      ]}
                    >
                      {PLACEHOLDER_WORDS[0]}
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.fakePlaceholderWord,
                        { position: "absolute", top: 0 },
                        { transform: [{ translateY: animB }] },
                      ]}
                    >
                      {PLACEHOLDER_WORDS[1]}
                    </Animated.Text>
                  </View>
                </View>
              )}
            </View>
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSubMuted}
                />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <FlatList
          data={restaurants}
          keyExtractor={keyExtractor}
          renderItem={renderRestaurantItem}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.emptySearchCard}>
              <View
                style={[
                  styles.emptyStateIconWrap,
                  {
                    backgroundColor: emptyStateIconBackgroundColor,
                    borderColor: emptyStateIconBorderColor,
                  },
                ]}
              >
                <Ionicons
                  name={emptyStateIconName}
                  size={42}
                  color={emptyStateIconColor}
                />
              </View>
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.amber} />
              ) : (
                <View>
                  <Text style={styles.emptyTitle}>
                    {error
                      ? "Could not load restaurants."
                      : "No restaurants found."}
                  </Text>
                  <Text style={styles.emptySub}>
                    {error || "Try another food filter or search term."}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    heroTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 30,
      fontWeight: "900",
      color: colors.textWarmDark,
      paddingHorizontal: 10,
    },
    emptyStateIconWrap: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: colors.bgEmptyOrange,
      borderWidth: 1,
      borderColor: colors.borderOrange,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    homeHeaderLocationContainer: {
      paddingLeft: 16,
      maxWidth: Platform.OS === "ios" ? "80%" : "60%",
    },
    homeHeaderLocationWrap: {
      justifyContent: "center",
      marginTop: 10,
    },
    homeHeaderLocationLabel: {
      fontFamily: "Nunito_700Bold",
      fontSize: 12,
      fontWeight: "700",
      color: colors.primaryDeep,
      marginBottom: 2,
    },
    homeHeaderLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    homeHeaderLocationText: {
      fontFamily: "Nunito_800ExtraBold",
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textDark,
    },
    closedModalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlays.locationBackdrop,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    closedModalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.bgWarm,
      borderRadius: 22,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.borderModalWarm,
      alignItems: "center",
    },
    closedModalTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 18,
      fontWeight: "900",
      color: colors.textDark,
      marginBottom: 10,
    },
    closedModalMessage: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMid,
      textAlign: "center",
      marginBottom: 20,
    },
    closedModalButton: {
      backgroundColor: "red",
      borderRadius: 12,
      paddingHorizontal: 40,
      paddingVertical: 12,
    },
    closedModalButtonText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 15,
      fontWeight: "800",
      color: "#fff",
    },
    homeLocationModalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlays.locationBackdrop,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    homeLocationModalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.bgWarm,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.borderModalWarm,
    },
    homeLocationModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    homeLocationModalTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 18,
      fontWeight: "900",
      color: colors.textDark,
    },
    homeLocationModalRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    homeLocationModalText: {
      fontFamily: "Inter_400Regular",
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMid,
    },
    foodFilterWrap: {
      paddingVertical: 6,
    },
    foodFilterScrollContent: {
      paddingHorizontal: 14,
      gap: 10,
    },
    foodFilterChip: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderFilterChip,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    foodFilterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    foodFilterChipText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 14,
      fontWeight: "800",
      color: colors.orangeText,
    },
    foodFilterChipTextActive: {
      color: colors.white,
    },
    foodFilterIcon: {
      width: 80,
      height: 50,
      marginBottom: 4,
    },
    foodFilterItem: {
      alignItems: "center",
    },
    searchBarAnimWrapper: {
      overflow: "hidden",
    },
    homeSearchWrap: {
      marginHorizontal: 14,
      marginTop: 4,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.bgWarmAlt,
      borderWidth: 1,
      borderColor: colors.borderSearchBar,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 48,
      width: "90%",
    },
    searchInputWrapper: {
      flex: 1,
    },
    fakePlaceholder: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
    },
    fakePlaceholderStatic: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.textSubMuted,
    },
    fakePlaceholderSlot: {
      height: PLACEHOLDER_WORD_HEIGHT,
      overflow: "hidden",
    },
    fakePlaceholderWord: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      color: colors.textSubMuted,
      height: PLACEHOLDER_WORD_HEIGHT,
      lineHeight: PLACEHOLDER_WORD_HEIGHT,
    },
    homeSearchInput: {
      fontFamily: "Inter_400Regular",
      flex: 1,
      paddingVertical: 0,
      fontSize: 15,
      color: colors.textWarmDark,
      backgroundColor: "transparent",
    },
    restaurantList: {
      paddingBottom: 120,
      gap: 30,
      flexGrow: 1,
    },
  }),
};
