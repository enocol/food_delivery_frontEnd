import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import sharedStyles from "../components/styles";
import { fetchRestaurantMenu } from "../apis/restaurantApi";

export default function RestaurantDetailsScreen({ route, navigation }) {
  const { addToCart } = useCart();
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
    <View style={styles.screen}>
      {/* <View style={styles.detailsTopControls}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.detailsBackButton}
        >
          <Ionicons name="chevron-back" size={30} color="#000000" />
        </Pressable>
      </View> */}

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
          {restaurant.name}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={styles.detailsContainer}
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
        <Text style={styles.detailsTitle}>{restaurant.name}</Text>
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
              <Text style={styles.menuName}>{item.name}</Text>
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
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}
      </Animated.ScrollView>

      {/* Menu item detail full-screen modal */}
      <Modal
        visible={!!selectedItem}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.itemSheetScreen}>
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
              <Ionicons name="close" size={22} color="#2f2a25" />
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
              color="#fff"
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
    </View>
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
      backgroundColor: "#fffaf4",
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f0e5d4",
    },
    detailsStickyTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 17,
      color: "#28231d",
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
      backgroundColor: "rgba(255, 250, 242, 0.9)",
      borderWidth: 1,
      borderColor: "#eadfd4",
      alignItems: "center",
      justifyContent: "center",
    },
    detailsTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 26,
      fontWeight: "900",
      color: "#28231d",
      marginTop: 14,
      paddingHorizontal: 14,
    },
    detailsMeta: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: "#5f5a53",
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    menuCard: {
      backgroundColor: "#fff",
      marginHorizontal: 14,
      marginTop: 10,
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#f0e5d4",
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
      backgroundColor: "#000000",
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
      color: "#302b25",
    },
    menuDescription: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: "#6b6359",
      marginTop: 4,
    },
    menuPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 14,
      color: "#2f6f43",
      fontWeight: "700",
      marginTop: 6,
    },
    itemSheetScreen: {
      flex: 1,
      backgroundColor: "#fffaf4",
      paddingTop: 20,
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
      backgroundColor: "rgba(255,250,244,0.9)",
      borderWidth: 1,
      borderColor: "#eadfd4",
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
      backgroundColor: "#f0e5d4",
      marginBottom: 14,
    },
    itemSheetName: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 20,
      fontWeight: "800",
      color: "#28231d",
      flex: 1,
    },
    itemSheetPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 18,
      fontWeight: "700",
      color: "#2f6f43",
    },
    itemSheetDescription: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: "#6b6359",
      lineHeight: 20,
    },
    itemSheetAddButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "orange",
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
      color: "#fff",
    },
  }),
};
