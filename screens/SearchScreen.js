import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import useRootCartHeader from "../components/useRootCartHeader";
import styles from "../components/styles";
import { toImageSource } from "../utils/imageSource";
import { fetchRestaurants } from "../apis/restaurantApi";

export default function SearchScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useRootCartHeader(navigation, cartCount, "Search", openCartSheet);

  useRootCartHeader(navigation, cartCount, "", openCartSheet, {
    headerHeight: 100,
    headerBackgroundColor: "orange",
  });

  useEffect(() => {
    let isActive = true;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchRestaurants({ search: query });
        if (!isActive) {
          return;
        }

        setRestaurants(data);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setRestaurants([]);
        setError(loadError.message || "Failed to search restaurants");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#eef7ef", "#f8f8f2"]}
        style={styles.gradientBackground}
      >
        <View style={styles.searchHeaderBlock}>
          <Text style={styles.sectionTitle}>Search restaurants and meals</Text>
          <Text style={styles.sectionSubtitle}>
            Find ndole, grilled fish, street food, and more.
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurant, cuisine, or dish"
            placeholderTextColor="#7f847d"
            style={styles.searchInput}
          />
        </View>

        <ScrollView contentContainerStyle={styles.searchResultsWrap}>
          {restaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              activeOpacity={0.88}
              style={styles.searchResultCard}
              onPress={() =>
                navigation.getParent()?.navigate("RestaurantDetails", {
                  restaurantId: restaurant.id,
                })
              }
            >
              <Image
                source={toImageSource(restaurant.image)}
                style={styles.searchResultImage}
              />
              <View style={styles.searchResultContent}>
                <Text style={styles.searchResultTitle}>{restaurant.name}</Text>
                <Text style={styles.metaText}>{restaurant.cuisine}</Text>
                <Text style={styles.metaText}>{restaurant.eta}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {!isLoading && restaurants.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptyTitle}>No matching results.</Text>
              <Text style={styles.emptySub}>
                {error || "Try another meal name or restaurant keyword."}
              </Text>
            </View>
          ) : null}

          {isLoading && restaurants.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptyTitle}>Searching restaurants...</Text>
              <Text style={styles.emptySub}>Results will appear here.</Text>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
