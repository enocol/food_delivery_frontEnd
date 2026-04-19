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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import useRootCartHeader from "../components/useRootCartHeader";
import styles from "../components/styles";
import { toImageSource } from "../utils/imageSource";
import { fetchRestaurants } from "../apis/restaurantApi";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import {
  FOOD_FILTERS,
  FILTER_ALIASES,
  FOOD_FILTER_IMAGES,
} from "../data/foodFilters";

const RestaurantCard = React.memo(function RestaurantCard({ item, onPress }) {
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
        <Text style={styles.metaText}>{item.eta}</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const [selectedFood, setSelectedFood] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(
    "Fetching location...",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const renderHeaderLocation = useCallback(
    () => (
      <Pressable
        onPress={() => setIsLocationModalVisible(true)}
        style={styles.homeHeaderLocationWrap}
      >
        <Text style={styles.homeHeaderLocationLabel}>Delivery to:</Text>
        <View style={styles.homeHeaderLocationRow}>
          <Ionicons name="location" size={14} color="#7c2d12" />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {deliveryLocation}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#7c2d12" />
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

    const loadRestaurants = async () => {
      setIsLoading(true);
      setError("");

      try {
        const aliases = selectedFood
          ? (FILTER_ALIASES[selectedFood] ?? [selectedFood])
          : [];
        const search = aliases[0];
        const data = await fetchRestaurants({ search });

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
        }
      }
    };

    loadDeliveryLocation();
    loadRestaurants();

    return () => {
      isActive = false;
    };
  }, [selectedFood]);

  const handleOpenRestaurant = useCallback(
    (restaurantId) => {
      navigation.getParent()?.navigate("RestaurantDetails", { restaurantId });
    },
    [navigation],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const renderRestaurantItem = useCallback(
    ({ item }) => <RestaurantCard item={item} onPress={handleOpenRestaurant} />,
    [handleOpenRestaurant],
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

        {/* <Text style={styles.heroTitle}>Order Food Across Cameroon</Text> */}
        <View style={styles.foodFilterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foodFilterScrollContent}
          >
            {FOOD_FILTERS.map((food) => {
              const isActive = selectedFood === food;
              const iconSource =
                FOOD_FILTER_IMAGES[food] ?? FOOD_FILTER_IMAGES.Achu;
              return (
                <View key={food} style={styles.foodFilterItem}>
                  <Pressable
                    onPress={() =>
                      setSelectedFood((prev) => (prev === food ? null : food))
                    }
                    style={[
                      styles.foodFilterChip,
                      isActive ? styles.foodFilterChipActive : null,
                    ]}
                  >
                    <Image source={iconSource} style={styles.foodFilterIcon} />
                  </Pressable>
                  <Text
                    style={[
                      styles.foodFilterChipText,
                      isActive ? styles.foodFilterChipTextActive : null,
                    ]}
                  >
                    {food}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={restaurants}
          keyExtractor={keyExtractor}
          renderItem={renderRestaurantItem}
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
                    {error || "Try another food filter."}
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
