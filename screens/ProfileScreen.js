import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { clearPostAuthRedirect } from "../utils/postAuthRedirect";
import { formatXaf } from "../utils/formatXaf";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import useRootCartHeader from "../components/useRootCartHeader";
import { useRootHeaderHeight, CARD_MAX_WIDTH } from "../utils/responsive";
import sharedStyles from "../components/styles";
import ScreenGradient from "../components/ScreenGradient";
import HeaderDeliveryLocation, {
  headerDeliveryLocationContainerStyle,
} from "../components/HeaderDeliveryLocation";
import * as colors from "../utils/colors";

export default function ProfileScreen({ navigation }) {
  const { cartTotal } = useCart();
  const { user, signOutUser, authActionLoading } = useAuth();
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState(
    "Fetching your location...",
  );
  const [locationCoords, setLocationCoords] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const renderHeaderLocation = useCallback(
    () => (
      <HeaderDeliveryLocation
        label={locationLabel}
        onPress={() => setIsLocationModalVisible(true)}
        // Transparent-header tab: nudge the block down to sit on the header.
        style={styles.headerLocationOffset}
      />
    ),
    [locationLabel],
  );

  const headerHeight = useRootHeaderHeight();
  useRootCartHeader(navigation, "Profile", {
    headerHeight,
    headerBackgroundColor: "#ff5a1f",
    headerLeft: renderHeaderLocation,
    headerLeftContainerStyle: headerDeliveryLocationContainerStyle,
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

  const isSignedIn = Boolean(user);
  const profileName = isSignedIn
    ? user?.displayName || "Mbolo member"
    : "Browsing as a guest";
  const profileMeta = isSignedIn
    ? user?.email || user?.phoneNumber || "Connected account"
    : "Sign in to keep your orders and delivery address";
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

  // No top edge below: the scroll content's paddingTop already includes the
  // top inset via headerHeight, so SafeAreaView must not add it again.
  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <ScreenGradient>
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
            </Pressable>
          </Pressable>
        </Modal>

        <ScrollView
          contentContainerStyle={[
            styles.profileWrap,
            { paddingTop: headerHeight + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {isSignedIn ? initials || "ME" : "?"}
              </Text>
            </View>
            <Text style={styles.profileName}>{profileName}</Text>
            <Text style={styles.profileMeta}>{profileMeta}</Text>
            {isSignedIn ? (
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
            ) : (
              <Pressable
                style={styles.profileSignOutButton}
                onPress={() => {
                  // Deliberate sign-in: do not inherit a checkout redirect
                  // queued earlier and abandoned.
                  clearPostAuthRedirect();
                  router.navigate("/Auth");
                }}
              >
                <Text style={styles.profileSignOutText}>Sign in</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </ScreenGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    headerLocationOffset: {
      marginTop: 10,
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
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 18,
      color: colors.textDark,
    },
    homeLocationModalRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    homeLocationModalText: {
      fontFamily: "Poppins_400Regular",
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMid,
    },
    homeLocationModalCoords: {
      marginTop: 10,
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: colors.textMuted,
    },
    profileWrap: {
      paddingBottom: 40,
      gap: 14,
      alignItems: "center",
    },
    profileCard: {
      // backgroundColor: colors.white,
      borderRadius: 18,
      padding: 20,
      alignItems: "center",
      borderColor: colors.border,
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
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
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 22,
    },
    profileName: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 22,
      color: colors.textHeadingWarm,
    },
    profileMeta: {
      fontFamily: "Poppins_400Regular",
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
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 14,
    },
    infoCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
    },
    infoCardTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 16,
      color: colors.textHeadingWarm,
      marginBottom: 10,
    },
    infoLine: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: colors.textMid,
      marginBottom: 8,
    },

    infoLineLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      color: colors.textHeadingWarm,
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
