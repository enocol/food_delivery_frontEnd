import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useRootCartHeader from "../components/useRootCartHeader";
import LikeButton from "../components/LikeButton";
import styles from "../components/styles";
import { toImageSource } from "../utils/imageSource";
import { fetchRestaurantMenu, fetchRestaurants } from "../apis/restaurantApi";
import { fetchLikes, likeRestaurant, unlikeRestaurant } from "../apis/likesApi";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import { FOOD_FILTERS, FILTER_ALIASES } from "../data/foodFilters";

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
      <Image
        source={toImageSource(item.image)}
        style={styles.detailsHeroImage}
        resizeMode="contain"
      />
      <View style={styles.restaurantContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <Text style={styles.metaText}>{item.cuisine}</Text>
        <View style={styles.restaurantMetaRow}>
          <Text style={styles.metaText}>{item.eta}</Text>
          <LikeButton liked={liked} onPress={() => onToggleLike(item.id)} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [likedRestaurantIds, setLikedRestaurantIds] = useState(() => ({}));

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
          <Ionicons name="location" size={20} color="#7c2d12" />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {deliveryLocation}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#7c2d12" />
        </View>
      </Pressable>
    ),
    [deliveryLocation],
  );

  useRootCartHeader(navigation, cartCount, "", openCartSheet, {
    headerHeight: 100,
    headerBackgroundColor: "orange",
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

  const handleOpenRestaurant = useCallback(
    (restaurantId) => {
      navigation.getParent()?.navigate("RestaurantDetails", { restaurantId });
    },
    [navigation],
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
  let emptyStateIconColor = "#ff8a00";
  let emptyStateIconBackgroundColor = "#fff4e8";
  let emptyStateIconBorderColor = "#ffd1a6";

  if (isLoading) {
    emptyStateIconName = "time-outline";
    emptyStateIconColor = "#d97706";
    emptyStateIconBackgroundColor = "#fff7e0";
    emptyStateIconBorderColor = "#f7d794";
  } else if (error) {
    emptyStateIconName = "alert-circle-outline";
    emptyStateIconColor = "#dc2626";
    emptyStateIconBackgroundColor = "#fff1f2";
    emptyStateIconBorderColor = "#fecdd3";
  }

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#fff7ec", "#fef3e2", "#f8f1e7"]}
        style={styles.gradientBackground}
      >
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
                  <Ionicons name="close" size={22} color="#2f2318" />
                </Pressable>
              </View>

              <View style={styles.homeLocationModalRow}>
                <Ionicons name="location" size={18} color="#ff8a00" />
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

        <View
          style={[
            styles.homeSearchWrap,
            isSearchFocused && { borderColor: "#000" },
          ]}
        >
          <Ionicons name="search" size={24} color="#7f5a3e" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search restaurant or menu"
            placeholderTextColor="#8b8177"
            style={styles.homeSearchInput}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>

        <FlatList
          data={restaurants}
          keyExtractor={keyExtractor}
          renderItem={renderRestaurantItem}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.restaurantList}
          initialNumToRender={4}
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
                <ActivityIndicator size="large" color="#d97706" />
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
      </LinearGradient>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
