import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  FlatList,
  Image,
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
import { fetchRestaurants } from "../utils/restaurantApi";

const FOOD_FILTERS = [
  "Achu",
  "Fried Rice",
  "Corn Chaff",
  "Eru",
  "Grilled Fish",
  "Koki",
  "Mbanga",
  "Ndole",
  "Pepper Soup",
  "Suya",
  "Street Food",
];

const FILTER_ALIASES = {
  "Fried Rice": ["fried rice", "friend rice"],
};

const FOOD_FILTER_IMAGES = {
  Achu: require("../assets/foods/achu.png"),
  "Fried Rice": require("../assets/foods/fried-rice.png"),
  "Corn Chaff": require("../assets/foods/corn-chaff.png"),
  Eru: require("../assets/foods/eru.png"),
  "Grilled Fish": require("../assets/foods/grilled-fish.png"),
  Koki: require("../assets/foods/koki.png"),
  Mbanga: require("../assets/foods/mbanga.png"),
  Ndole: require("../assets/foods/ndole.png"),
  "Pepper Soup": require("../assets/foods/pepper-soup.png"),
  Suya: require("../assets/foods/suya.png"),
  // 'Street Food': require('../assets/foods/street-food.png'),
};

const RestaurantCard = React.memo(function RestaurantCard({ item, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.restaurantCard}
      onPress={() => onPress(item.id)}
    >
      <Image
        source={toImageSource(item.image)}
        style={styles.restaurantImage}
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

  useRootCartHeader(navigation, cartCount, "", openCartSheet, {
    headerHeight: 100,
    headerBackgroundColor: "#fff7ec",
  });

  useEffect(() => {
    let isActive = true;

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

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#fff7ec", "#fef3e2", "#f8f1e7"]}
        style={styles.gradientBackground}
      >
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
              <Text style={styles.emptyTitle}>
                {isLoading ? "Loading restaurants..." : "No restaurants found."}
              </Text>
              <Text style={styles.emptySub}>
                {error || "Try another food filter."}
              </Text>
            </View>
          }
        />
      </LinearGradient>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
