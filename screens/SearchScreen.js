import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import { toImageSource } from "../utils/imageSource";
import { fetchRestaurants } from "../apis/restaurantApi";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    searchHeaderBlock: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    sectionTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 28,
      fontWeight: "900",
      color: "#202420",
    },
    sectionSubtitle: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: "#637063",
      marginTop: 5,
      marginBottom: 12,
    },
    searchInput: {
      fontFamily: "Inter_400Regular",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#dbe4d7",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: "#202420",
    },
    searchResultsWrap: {
      paddingHorizontal: 14,
      paddingBottom: 20,
    },
    searchResultCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#dbe4d7",
      marginBottom: 12,
    },
    searchResultImage: {
      width: "100%",
      height: 130,
    },
    searchResultContent: {
      padding: 12,
    },
    searchResultTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 16,
      fontWeight: "800",
      color: "#202420",
    },
  }),
};

export default function SearchScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
