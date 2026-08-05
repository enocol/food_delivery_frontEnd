import React, { useCallback, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Modal,
  Platform,
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
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const renderHeaderLocation = useCallback(
    () => (
      <Pressable
        onPress={() => setIsLocationModalVisible(true)}
        style={styles.homeHeaderLocationWrap}
      >
        <Text style={styles.homeHeaderLocationLabel}>Delivery to:</Text>
        <View style={styles.homeHeaderLocationRow}>
          <Ionicons name="location" size={20} color={colors.primaryDeep} />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primaryDeep} />
        </View>
      </Pressable>
    ),
    [locationLabel],
  );

  useRootCartHeader(navigation, cartCount, "Profile", openCartSheet, {
    headerHeight: 130,
    headerBackgroundColor: "#ff5a1f",
    headerLeft: renderHeaderLocation,
    headerLeftContainerStyle: styles.homeHeaderLocationContainer,
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
                  {locationLabel}
                </Text>
              </View>
              {locationCoords ? (
                <Text style={styles.homeLocationModalCoords}>
                  {locationCoords}
                </Text>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>

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
      color: colors.textDark,
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
    homeLocationModalCoords: {
      marginTop: 10,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.textMuted,
    },
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
      backgroundColor: "#ff5a1f",
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
      backgroundColor: "#ff5a1f",
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
