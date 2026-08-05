import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import { SkeletonBlock } from "../components/LoadingPlaceholder";
import * as colors from "../utils/colors";
import { fetchRestaurantMenu, fetchRestaurants } from "../apis/restaurantApi";
import {
  fetchLikes,
  fetchRestaurantLikeCount,
  likeRestaurant,
  unlikeRestaurant,
} from "../apis/likesApi";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import { FILTER_ALIASES, FOOD_FILTERS } from "../data/foodFilters";
import RestaurantCard from "../components/RestaurantCard";
import HomeSearchBar from "../components/HomeSearchBar";
import HomeFoodFilter from "../components/HomeFoodFilter";
import HomeGreetingBanner from "../components/HomeGreetingBanner";
import FloatingBasketButton from "../components/FloatingBasketButton";

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
  const insets = useSafeAreaInsets();
  const { cartCount, openCartSheet } = useCart();
  const { firebaseUid, user } = useAuth();
  const customerName =
    user?.displayName?.trim()?.split(/\s+/)?.[0] ||
    user?.email?.trim()?.split("@")[0] ||
    "Alex";
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
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [likedRestaurantIds, setLikedRestaurantIds] = useState(() => ({}));
  const [likedRestaurantCounts, setLikedRestaurantCounts] = useState(
    () => ({}),
  );
  const searchBarAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const searchBarVisibilityRef = useRef(1);
  const restaurantsCacheRef = useRef([]);
  const menuCacheRef = useRef(new Map());
  const lastRefreshNonceRef = useRef(-1);

  // Seed liked state from the server whenever a user is authenticated.
  useEffect(() => {
    if (!firebaseUid) {
      setLikedRestaurantIds({});
      setLikedRestaurantCounts({});
      return;
    }

    let isActive = true;

    fetchLikes(firebaseUid)
      .then((rows) => {
        if (!isActive) return;
        const map = {};
        rows.forEach((row) => {
          const restaurantId =
            row?.restaurantId ??
            row?.restaurant_id ??
            row?.restaurant?.id ??
            row;

          if (restaurantId == null) {
            return;
          }

          map[String(restaurantId)] = true;
        });
        setLikedRestaurantIds(map);
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn("[LikeButton] failed to load likes", error);
        }
      });

    return () => {
      isActive = false;
    };
  }, [firebaseUid]);

  useEffect(() => {
    if (!restaurants.length) {
      setLikedRestaurantCounts({});
      return;
    }

    let isActive = true;

    const loadLikeCounts = async () => {
      const countEntries = await Promise.all(
        restaurants.map(async (restaurant) => {
          const restaurantId = String(restaurant.id);

          try {
            const likesCount = await fetchRestaurantLikeCount(restaurantId);
            return [restaurantId, likesCount];
          } catch (countError) {
            if (__DEV__) {
              console.warn(
                `[LikeButton] failed to load like count for restaurant ${restaurantId}`,
                countError,
              );
            }
            return [restaurantId, 0];
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setLikedRestaurantCounts(Object.fromEntries(countEntries));
    };

    loadLikeCounts();

    return () => {
      isActive = false;
    };
  }, [restaurants]);

  const renderHeaderLocation = useCallback(
    () => (
      <Pressable
        onPress={() => setIsLocationModalVisible(true)}
        style={styles.homeHeaderLocationWrap}
      >
        <Text style={styles.homeHeaderLocationLabel}>Delivery to:</Text>
        <View style={styles.homeHeaderLocationRow}>
          <Ionicons name="location" size={25} color={colors.white} />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {deliveryLocation}
          </Text>
          <Ionicons name="chevron-down" size={25} color={colors.white} />
        </View>
      </Pressable>
    ),
    [deliveryLocation],
  );

  useRootCartHeader(navigation, cartCount, "", openCartSheet, {
    headerHeight: 130,
    headerBackgroundColor: "#ff5a1f",
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
        const shouldFetchRestaurants =
          !restaurantsCacheRef.current.length ||
          lastRefreshNonceRef.current !== refreshNonce;

        if (shouldFetchRestaurants) {
          menuCacheRef.current.clear();
          restaurantsCacheRef.current = await fetchRestaurants();
          lastRefreshNonceRef.current = refreshNonce;
        }

        const allRestaurants = restaurantsCacheRef.current;
        const selectedMenuTerms = activeFilter
          ? getFilterTerms(activeFilter)
          : [];
        const queryTerms = query ? [query] : [];
        const needsMenuLookup = Boolean(activeFilter || query);

        const menuByRestaurantId = new Map();

        if (needsMenuLookup) {
          const menuResponses = await Promise.allSettled(
            allRestaurants.map(async (restaurant) => {
              const cachedMenu = menuCacheRef.current.get(restaurant.id);
              if (cachedMenu) {
                return {
                  restaurantId: restaurant.id,
                  menu: cachedMenu,
                };
              }

              const payload = await fetchRestaurantMenu(restaurant.id);
              const menu = payload?.menu || [];
              menuCacheRef.current.set(restaurant.id, menu);

              return {
                restaurantId: restaurant.id,
                menu,
              };
            }),
          );

          menuResponses.forEach((response) => {
            if (response.status !== "fulfilled") {
              return;
            }

            menuByRestaurantId.set(
              response.value.restaurantId,
              response.value.menu,
            );
          });
        }

        const data = allRestaurants.filter((restaurant) => {
          const menuItems = menuByRestaurantId.get(restaurant.id) || [];

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
    restaurantsCacheRef.current = [];
    menuCacheRef.current.clear();
    setRefreshNonce((value) => value + 1);
  }, []);

  const handleScroll = useCallback(
    (event) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const currentY = contentOffset.y;
      const maxOffsetY = Math.max(
        0,
        (contentSize?.height || 0) - (layoutMeasurement?.height || 0),
      );
      const isNearBottom = currentY >= Math.max(0, maxOffsetY - 8);
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (currentY <= 0) {
        searchBarVisibilityRef.current = 1;
        searchBarAnim.stopAnimation();
        searchBarAnim.setValue(1);
        return;
      }

      if (diff > 0) {
        const nextVisibility = Math.max(
          0,
          searchBarVisibilityRef.current - diff / 72,
        );
        searchBarVisibilityRef.current = nextVisibility;
        searchBarAnim.stopAnimation();
        searchBarAnim.setValue(nextVisibility);
        return;
      }

      if (diff < 0 && !isNearBottom) {
        searchBarVisibilityRef.current = 1;
        searchBarAnim.stopAnimation();
        searchBarAnim.setValue(1);
      }
    },
    [searchBarAnim],
  );

  // Always restore the search bar when the user is actively using it.
  useEffect(() => {
    if (isSearchFocused || searchQuery.length > 0) {
      searchBarVisibilityRef.current = 1;
      searchBarAnim.stopAnimation();
      searchBarAnim.setValue(1);
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
      const key = String(restaurantId);

      setLikedRestaurantIds((previous) => {
        const isCurrentlyLiked = Boolean(previous[key]);
        if (isCurrentlyLiked) {
          unlikeRestaurant(firebaseUid, restaurantId).catch((error) => {
            if (__DEV__) {
              console.warn("[LikeButton] unlike failed", error);
            }
          });
        } else {
          likeRestaurant(firebaseUid, restaurantId).catch((error) => {
            if (__DEV__) {
              console.warn("[LikeButton] like failed", error);
            }
          });
        }

        setLikedRestaurantCounts((previousCounts) => {
          const currentCount = Number(previousCounts[key]) || 0;

          return {
            ...previousCounts,
            [key]: isCurrentlyLiked
              ? Math.max(0, currentCount - 1)
              : currentCount + 1,
          };
        });

        return { ...previous, [key]: !isCurrentlyLiked };
      });
    },
    [firebaseUid],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const aiRecommendations = useMemo(() => {
    const nextFood =
      FOOD_FILTERS.find((food) => food !== "All" && food !== selectedFood) ||
      "Fried Rice";

    const cuisines = Array.from(
      new Set(
        restaurants
          .map((restaurant) => String(restaurant?.cuisine || "").trim())
          .filter(Boolean),
      ),
    ).slice(0, 2);

    const suggestions = [
      {
        id: "ai-trending",
        title: `Trending now: ${nextFood}`,
        subtitle: "Apply a food filter for instant picks.",
        food: nextFood,
        query: "",
      },
      {
        id: "ai-reset",
        title: "Reset and explore all",
        subtitle: "Clear search and show the full restaurant list.",
        food: "All",
        query: "",
      },
      ...cuisines.map((cuisine, index) => ({
        id: `ai-cuisine-${index}`,
        title: `Try ${cuisine}`,
        subtitle: "Search restaurants and menu items by cuisine.",
        food: "All",
        query: cuisine,
      })),
    ];

    return suggestions.slice(0, 4);
  }, [restaurants, selectedFood]);

  const handleOpenFilterModal = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);

  const handleApplyFilter = useCallback((food) => {
    setSelectedFood(food);
    setIsFilterModalVisible(false);
  }, []);

  const handleOpenAiModal = useCallback(() => {
    setIsAiModalVisible(true);
  }, []);

  const handleApplyAiRecommendation = useCallback((recommendation) => {
    setSelectedFood(recommendation.food);
    setSearchQuery(recommendation.query);
    setDebouncedSearchQuery(recommendation.query);
    setIsAiModalVisible(false);
  }, []);

  const renderRestaurantItem = useCallback(
    ({ item }) => (
      <RestaurantCard
        item={item}
        onPress={handleOpenRestaurant}
        liked={Boolean(likedRestaurantIds[String(item.id)])}
        likeCount={Number(likedRestaurantCounts[String(item.id)]) || 0}
        onToggleLike={handleToggleLike}
      />
    ),
    [
      handleOpenRestaurant,
      handleToggleLike,
      likedRestaurantCounts,
      likedRestaurantIds,
    ],
  );

  let emptyStateIconName = "restaurant-outline";
  let emptyStateIconColor = colors.orange;
  let emptyStateIconBackgroundColor = colors.bgEmptyOrange;
  let emptyStateIconBorderColor = colors.borderOrange;
  const listBottomPadding = 75 + 16 + insets.bottom + 20;

  if (error) {
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
                  style={styles.homeLocationModalCloseButton}
                  onPress={() => setIsLocationModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.white} />
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

        <Modal
          visible={isFilterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFilterModalVisible(false)}
        >
          <Pressable
            style={styles.homeLocationModalBackdrop}
            onPress={() => setIsFilterModalVisible(false)}
          >
            <Pressable style={styles.homeLocationModalCard} onPress={() => {}}>
              <View style={styles.homeLocationModalHeader}>
                <Text style={styles.homeLocationModalTitle}>Quick filters</Text>
                <Pressable
                  style={styles.homeLocationModalCloseButton}
                  onPress={() => setIsFilterModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.filterChipWrap}>
                {FOOD_FILTERS.map((food) => {
                  const isActive = selectedFood === food;

                  return (
                    <Pressable
                      key={food}
                      style={[
                        styles.filterChip,
                        isActive ? styles.filterChipActive : null,
                      ]}
                      onPress={() => handleApplyFilter(food)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive ? styles.filterChipTextActive : null,
                        ]}
                      >
                        {food}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={isAiModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAiModalVisible(false)}
        >
          <Pressable
            style={styles.homeLocationModalBackdrop}
            onPress={() => setIsAiModalVisible(false)}
          >
            <Pressable style={styles.homeLocationModalCard} onPress={() => {}}>
              <View style={styles.homeLocationModalHeader}>
                <Text style={styles.homeLocationModalTitle}>
                  AI Recommendations
                </Text>
                <Pressable
                  style={styles.homeLocationModalCloseButton}
                  onPress={() => setIsAiModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.aiSuggestionWrap}>
                {aiRecommendations.map((recommendation) => (
                  <Pressable
                    key={recommendation.id}
                    style={styles.aiSuggestionCard}
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium,
                      );
                      handleApplyAiRecommendation(recommendation);
                    }}
                  >
                    <Text style={styles.aiSuggestionTitle}>
                      {recommendation.title}
                    </Text>
                    <Text style={styles.aiSuggestionSubtext}>
                      {recommendation.subtitle}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <HomeGreetingBanner customerName={customerName} />

        <HomeFoodFilter
          selectedFood={selectedFood}
          setSelectedFood={setSelectedFood}
        />

        <Animated.View
          style={[
            styles.searchRowWrap,
            {
              maxHeight: searchBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 86],
              }),
              opacity: searchBarAnim,
              transform: [
                {
                  translateY: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <HomeSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchFocused={isSearchFocused}
            setIsSearchFocused={setIsSearchFocused}
            searchBarAnim={searchBarAnim}
            onSearchInputFocus={() => setSelectedFood("All")}
            containerStyle={styles.searchBarRowItem}
          />
          <Animated.View
            style={[
              styles.searchActionsWrap,
              {
                maxHeight: searchBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 70],
                }),
                opacity: searchBarAnim,
              },
            ]}
          >
            <Pressable
              style={styles.searchActionButtonPlain}
              accessibilityRole="button"
              accessibilityLabel="Filter options"
              onPress={() => {
                void Haptics.selectionAsync();
                handleOpenFilterModal();
              }}
            >
              <Ionicons name="options-outline" size={28} color="#e8772e" />
            </Pressable>

            <Pressable
              style={styles.searchActionButtonCircle}
              accessibilityRole="button"
              accessibilityLabel="Magic recommendations"
              onPress={() => {
                void Haptics.selectionAsync();
                handleOpenAiModal();
              }}
            >
              <Ionicons name="sparkles" size={26} color="#263238" />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <FlatList
          data={restaurants}
          keyExtractor={keyExtractor}
          renderItem={renderRestaurantItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.restaurantList,
            { paddingBottom: listBottomPadding },
          ]}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.homeLoadingList}>
                {[1, 2, 3].map((item) => (
                  <View key={item} style={styles.homeLoadingCard}>
                    <SkeletonBlock style={styles.homeLoadingImage} />
                    <View style={styles.homeLoadingContent}>
                      <SkeletonBlock style={styles.homeLoadingTitle} />
                      <SkeletonBlock style={styles.homeLoadingMeta} />
                      <SkeletonBlock style={styles.homeLoadingMetaWide} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
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
              </View>
            )
          }
        />

        <FloatingBasketButton
          count={cartCount}
          onPress={openCartSheet}
          bottom={Math.max(insets.bottom + 68, 68)}
          variant="compact"
        />
      </View>
      <StatusBar style="auto" />
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
    homeLoadingList: {
      marginTop: 20,
      gap: 12,
      paddingHorizontal: 2,
      paddingBottom: 16,
    },
    homeLoadingCard: {
      backgroundColor: colors.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderMid,
      overflow: "hidden",
    },
    homeLoadingImage: {
      width: "100%",
      height: 160,
      borderRadius: 0,
    },
    homeLoadingContent: {
      padding: 14,
      gap: 8,
    },
    homeLoadingTitle: {
      height: 18,
      width: "64%",
    },
    homeLoadingMeta: {
      height: 13,
      width: "40%",
    },
    homeLoadingMetaWide: {
      height: 13,
      width: "55%",
    },
    searchRowWrap: {
      flexDirection: "row",
      direction: "ltr",
      alignItems: "center",
      paddingHorizontal: 12,
      marginTop: 10,
      gap: 10,
      overflow: "hidden",
    },
    searchActionsWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      overflow: "hidden",
    },
    searchActionButtonPlain: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgWarm,
    },
    searchActionButtonCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bgWarm,
      borderWidth: 1,
      borderColor: "#b7bacf",
    },
    searchBarRowItem: {
      flex: 1,
      width: "auto",
      marginHorizontal: 0,
      marginTop: 0,
    },
    filterChipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 6,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.white,
    },
    filterChipActive: {
      backgroundColor: colors.orange,
      borderColor: colors.orange,
    },
    filterChipText: {
      fontFamily: "Nunito_700Bold",
      fontSize: 13,
      fontWeight: "700",
      color: colors.textDark,
    },
    filterChipTextActive: {
      color: colors.white,
    },
    aiSuggestionWrap: {
      marginTop: 6,
      gap: 10,
    },
    aiSuggestionCard: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 14,
      backgroundColor: colors.white,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    aiSuggestionTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 15,
      fontWeight: "800",
      color: colors.textDark,
    },
    aiSuggestionSubtext: {
      marginTop: 4,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.textMid,
      lineHeight: 19,
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
      fontSize: 15,
      fontWeight: "700",
      color: colors.white,
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
      color: colors.white,
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
    homeLocationModalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.black,
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
    restaurantList: {
      paddingBottom: 120,
      paddingHorizontal: 12,
      rowGap: 12,
      gap: 30,
      flexGrow: 1,
    },
  }),
};
