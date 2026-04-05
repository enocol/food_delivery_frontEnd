import React, { useCallback, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatXaf } from "../utils/formatXaf";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import useRootCartHeader from "../components/useRootCartHeader";
import styles from "../components/styles";

export default function ProfileScreen({ navigation }) {
  const { cartCount, cartTotal, openCartSheet } = useCart();
  const { user, signOutUser, authActionLoading } = useAuth();
  const [locationLabel, setLocationLabel] = useState(
    "Fetching your location...",
  );
  const [locationCoords, setLocationCoords] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  useRootCartHeader(navigation, cartCount, "Profile", openCartSheet);

  const loadCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const coords = await getCurrentLocation();
      const address = await getLocationAddress(
        coords.latitude,
        coords.longitude,
      );

      const addressParts = [
        address?.name,
        address?.street,
        address?.city,
        address?.region,
      ]
        .filter(Boolean)
        .join(", ");

      setLocationLabel(addressParts || "Current location available");
      setLocationCoords(
        `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
      );
    } catch (error) {
      setLocationLabel(
        "Location unavailable. Please enable location permission.",
      );
      setLocationCoords("");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentLocation();
  }, [loadCurrentLocation]);

  const profileName = user?.displayName || "Mbolo member";
  const profileMeta = user?.email || user?.phoneNumber || "Connected account";
  const initials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0].toUpperCase())
    .join("");

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      Alert.alert("Sign out failed", error.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#fff8f0", "#f8efe8"]}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.profileWrap}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials || "ME"}</Text>
            </View>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.profileMeta}>{profileMeta}</Text>
            <Pressable
              style={[
                styles.profileSignOutButton,
                authActionLoading && styles.profileSignOutButtonDisabled,
              ]}
              onPress={handleSignOut}
              disabled={authActionLoading}
            >
              <Text style={styles.profileSignOutText}>Sign out</Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Account summary</Text>
            <Text style={styles.infoLine}>Open cart items: {cartCount}</Text>
            <Text style={styles.infoLine}>
              Current cart total: {formatXaf(cartTotal)}
            </Text>
            <Text style={styles.infoLine}>
              Current Delivery Address: {locationLabel}
            </Text>
            {locationCoords ? (
              <Text style={styles.infoLine}>Coordinates: {locationCoords}</Text>
            ) : null}
            <Pressable
              style={[
                styles.profileLocationButton,
                locationLoading && styles.profileLocationButtonDisabled,
              ]}
              onPress={loadCurrentLocation}
              disabled={locationLoading}
            >
              <Text style={styles.profileLocationButtonText}>
                {locationLoading
                  ? "Refreshing location..."
                  : "Refresh location"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Quick actions</Text>
            <Text style={styles.infoLine}>Saved addresses</Text>
            <Text style={styles.infoLine}>Payment methods</Text>
            <Text style={styles.infoLine}>Order history</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
