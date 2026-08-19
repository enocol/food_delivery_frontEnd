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
      <Pressable
        onPress={() => setIsLocationModalVisible(true)}
        style={styles.homeHeaderLocationWrap}
      >
        <Text style={styles.homeHeaderLocationLabel}>Delivery to:</Text>
        <View style={styles.homeHeaderLocationRow}>
          <Ionicons name="location" size={25} color={colors.white} />
          <Text style={styles.homeHeaderLocationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={25} color={colors.white} />
        </View>
      </Pressable>
    ),
    [locationLabel],
  );

  const headerHeight = useRootHeaderHeight();
  useRootCartHeader(navigation, "Profile", {
    headerHeight,
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
      <LinearGradient
        colors={colors.gradients.warmCream}
        style={styles.screenBody}
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
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    // Replaces the shared `gradientBackground`, whose marginTop: -40 was a
    // hardcoded cancel for top safe-area padding this screen no longer adds.
    // That constant only matched iOS notch insets and pulled the body up under
    // the header on Android, where the inset is ~23dp.
    screenBody: {
      flex: 1,
    },
    homeHeaderLocationContainer: {
      paddingLeft: 16,
      maxWidth: Platform.OS === "ios" ? "80%" : "60%",
    },
    homeHeaderLocationWrap: {
      justifyContent: "center",
      marginTop: 10,
    },
    homeHeaderLocationLabel: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 15,
      color: colors.white,
      marginBottom: 2,
    },
    homeHeaderLocationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    homeHeaderLocationText: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      flexShrink: 1,
      fontSize: 14,
      color: colors.white,
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 18,
      color: colors.textDark,
    },
    homeLocationModalRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    homeLocationModalText: {
      fontFamily: "PlusJakartaSans_400Regular",
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMid,
    },
    homeLocationModalCoords: {
      marginTop: 10,
      fontFamily: "PlusJakartaSans_400Regular",
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: colors.white,
      fontSize: 22,
    },
    profileName: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 22,
      color: colors.textHeadingWarm,
    },
    profileMeta: {
      fontFamily: "PlusJakartaSans_400Regular",
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 16,
      color: colors.textHeadingWarm,
      marginBottom: 10,
    },
    infoLine: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 14,
      color: colors.textMid,
      marginBottom: 8,
    },

    infoLineLabel: {
      fontFamily: "PlusJakartaSans_600SemiBold",
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
