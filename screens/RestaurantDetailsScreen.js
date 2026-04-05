import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import styles from "../components/styles";
import { fetchRestaurantMenu } from "../utils/restaurantApi";

export default function RestaurantDetailsScreen({ route, navigation }) {
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingItemId, setAddingItemId] = useState(null);

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
    <View style={styles.screen}>
      <View style={styles.detailsTopControls}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.detailsBackButton}
        >
          <Ionicons name="chevron-back" size={30} color="#000000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.detailsContainer}
      >
        <Image
          source={toImageSource(restaurant.image)}
          style={styles.detailsHeroImage}
        />
        <Text style={styles.detailsTitle}>{restaurant.name}</Text>
        <Text style={styles.detailsMeta}>
          {restaurant.cuisine} • {restaurant.eta}
        </Text>

        {restaurant.menu.map((item) => (
          <View key={item.id} style={styles.menuCard}>
            <Image
              source={toImageSource(item.image)}
              style={styles.menuImage}
            />
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
              <Text style={styles.menuPrice}>{formatXaf(item.price)}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item)}
              disabled={addingItemId === String(item.id)}
            >
              <Text style={styles.addButtonText}>
                {addingItemId === String(item.id) ? "Adding..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
