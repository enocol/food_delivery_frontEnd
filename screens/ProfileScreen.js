import React, { useCallback, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatXaf } from "../utils/formatXaf";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";

export default function ProfileScreen({ navigation }) {
  const { cartCount, cartTotal, openCartSheet } = useCart();
  const { user, signOutUser, authActionLoading } = useAuth();
  const [locationLabel, setLocationLabel] = useState(
    "Fetching your location...",
  );
  const [locationCoords, setLocationCoords] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  // useRootCartHeader(navigation, cartCount, "Profile", openCartSheet);

  useRootCartHeader(navigation, cartCount, "Profile", openCartSheet, {
    headerHeight: 130,
    headerBackgroundColor: "#ffffff",
  });

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
        colors={colors.gradients.warmCream}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.profileWrap}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    profileWrap: {
      paddingVertical: 100,
      gap: 14,
    },
    profileCard: {
      backgroundColor: colors.white,
      borderRadius: 18,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      marginTop: 20,
    },
    avatarText: {
      fontFamily: "Nunito_900Black",
      color: colors.white,
      fontSize: 22,
      fontWeight: "900",
    },
    profileName: {
      fontFamily: "Nunito_900Black",
      fontSize: 22,
      fontWeight: "900",
      color: colors.textHeadingWarm,
    },
    profileMeta: {
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      fontSize: 14,
      color: colors.textMuted,
    },
    profileSignOutButton: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.textDark,
    },
    profileSignOutButtonDisabled: {
      opacity: 0.6,
    },
    profileSignOutText: {
      fontFamily: "Nunito_800ExtraBold",
      color: colors.white,
      fontSize: 14,
      fontWeight: "800",
    },
    infoCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCardTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 16,
      fontWeight: "800",
      color: colors.textHeadingWarm,
      marginBottom: 10,
    },
    infoLine: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.textMid,
      marginBottom: 8,
    },
    profileLocationButton: {
      marginTop: 6,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.textDark,
    },
    profileLocationButtonDisabled: {
      opacity: 0.6,
    },
    profileLocationButtonText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "700",
    },
  }),
};
