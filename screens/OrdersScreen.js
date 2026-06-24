import React, { useCallback, useEffect, useMemo, memo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useRootCartHeader from "../components/useRootCartHeader";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";
import { formatXaf } from "../utils/formatXaf";
import { fetchCustomerOrders } from "../apis/orderApi";
import { getSocket } from "../utils/socket";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";

function toDateLabel(dateValue) {
  if (!dateValue) {
    return "Date unavailable";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function getItemCount(order) {
  if (typeof order?.totals?.itemCount === "number") {
    return order.totals.itemCount;
  }

  if (Array.isArray(order?.items)) {
    return order.items.reduce((sum, item) => {
      const qty = Number(item?.qty) || 0;
      return sum + qty;
    }, 0);
  }

  return 0;
}

function getOrderTotal(order) {
  if (typeof order?.totals?.cartTotal === "number") {
    return order.totals.cartTotal;
  }

  if (typeof order?.total === "number") {
    return order.total;
  }

  if (Array.isArray(order?.items)) {
    return order.items.reduce((sum, item) => {
      const qty = Number(item?.qty || item?.quantity || 0);
      const price = Number(item?.price || item?.unit_price || 0);
      return sum + qty * price;
    }, 0);
  }

  return 0;
}

function getRestaurantName(order) {
  if (
    typeof order?.restaurantName === "string" &&
    order.restaurantName.trim()
  ) {
    return order.restaurantName.trim();
  }

  if (
    typeof order?.restaurant_name === "string" &&
    order.restaurant_name.trim()
  ) {
    return order.restaurant_name.trim();
  }

  if (
    typeof order?.restaurant?.name === "string" &&
    order.restaurant.name.trim()
  ) {
    return order.restaurant.name.trim();
  }

  if (Array.isArray(order?.items) && order.items.length > 0) {
    const firstWithName = order.items.find(
      (item) =>
        typeof item?.restaurantName === "string" && item.restaurantName.trim(),
    );

    if (firstWithName?.restaurantName) {
      return firstWithName.restaurantName.trim();
    }
  }

  return "Restaurant unavailable";
}

function getPaymentStatusColors(paymentStatus) {
  switch (String(paymentStatus || "").toLowerCase()) {
    case "paid":
    case "success":
    case "successful":
      return {
        bg: "#f0fdf4",
        border: "#bbf7d0",
        dot: "#0d9668",
        text: "#0d9668",
        label: "Payment successful",
      };
    case "pending":
      return {
        bg: "#fffbeb",
        border: "#fde68a",
        dot: "#f59e0b",
        text: "#b45309",
        label: "Payment pending",
      };
    case "failed":
    case "failure":
    case "error":
      return {
        bg: "#fff1f2",
        border: "#fecdd3",
        dot: "#dc2626",
        text: "#dc2626",
        label: "Payment failed",
      };
    case "refunded":
      return {
        bg: "#eff6ff",
        border: "#bfdbfe",
        dot: "#2563eb",
        text: "#1d4ed8",
        label: "Payment refunded",
      };
    default:
      return {
        bg: "#f8fafc",
        border: "#e2e8f0",
        dot: "#94a3b8",
        text: "#475569",
        label: String(paymentStatus),
      };
  }
}

function groupItemsByRestaurant(items) {
  if (!Array.isArray(items)) return [];
  const map = {};
  const order = [];
  for (const item of items) {
    const key =
      item?.restaurantName || item?.restaurant_name || "Unknown restaurant";
    if (!map[key]) {
      map[key] = [];
      order.push(key);
    }
    map[key].push(item);
  }
  return order.map((name) => ({ restaurantName: name, items: map[name] }));
}

const OrderCard = memo(function OrderCard({ item }) {
  const createdAt = item?.createdAt || item?.created_at;
  const itemCount = getItemCount(item);
  const total = getOrderTotal(item);
  const status = item?.status || item?.payment?.status || "confirmed";
  const paymentStatus = item?.paymentStatus || item?.payment_status || null;
  const groups = groupItemsByRestaurant(item?.items);
  const paymentColors = paymentStatus
    ? getPaymentStatusColors(paymentStatus)
    : null;

  return (
    <View style={styles.orderCard}>
      {paymentColors && (
        <View
          style={[
            styles.paymentStrip,
            {
              backgroundColor: paymentColors.bg,
              borderBottomColor: paymentColors.border,
            },
          ]}
        >
          <View
            style={[
              styles.paymentStripDot,
              { backgroundColor: paymentColors.dot },
            ]}
          />
          <Text
            style={[styles.paymentStripText, { color: paymentColors.text }]}
          >
            {paymentColors.label}
          </Text>
        </View>
      )}
      <View style={styles.orderCardContent}>
        <View style={styles.orderRowBetween}>
          <Text style={styles.orderMetaText}>{toDateLabel(createdAt)}</Text>
          <Text style={styles.orderStatusText}>{status}</Text>
        </View>
        {groups.map((group) => (
          <View key={group.restaurantName} style={styles.orderRestaurantGroup}>
            <Text style={styles.orderRestaurantText}>
              {group.restaurantName}
            </Text>
            {group.items.map((lineItem, idx) => (
              <View key={idx} style={styles.orderItemRow}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  · {lineItem.name}
                </Text>
                <Text style={styles.orderItemQty}>x{lineItem.qty}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={[styles.orderRowBetween, styles.orderCardFooter]}>
          <Text style={styles.orderSummaryText}>{itemCount} item(s)</Text>
          <Text style={styles.orderTotalText}>{formatXaf(total)}</Text>
        </View>
      </View>
    </View>
  );
});

function keyExtractor(item, index) {
  return String(item?.id || item?.orderRef || index);
}

export default function OrdersScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const { firebaseUid, getAuthToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(
    "Fetching location...",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadDeliveryLocation = async () => {
      try {
        const coords = await getCurrentLocation();
        const address = await getLocationAddress(
          coords.latitude,
          coords.longitude,
        );

        if (!isActive) {
          return;
        }

        const locationText = [
          address?.name,
          address?.street,
          address?.city,
          address?.region,
        ]
          .filter(Boolean)
          .join(", ");

        setDeliveryLocation(locationText || "Current location");
      } catch (locationError) {
        if (!isActive) {
          return;
        }

        setDeliveryLocation("Location unavailable");
      }
    };

    loadDeliveryLocation();

    return () => {
      isActive = false;
    };
  }, []);

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
            {deliveryLocation}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.primaryDeep} />
        </View>
      </Pressable>
    ),
    [deliveryLocation],
  );

  useRootCartHeader(navigation, cartCount, "Orders", openCartSheet, {
    headerHeight: 130,
    headerBackgroundColor: "#ffffff",
    headerLeft: renderHeaderLocation,
    headerLeftContainerStyle: styles.homeHeaderLocationContainer,
  });

  const loadOrders = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const token = await getAuthToken();
        const data = await fetchCustomerOrders(token, firebaseUid);

        setOrders(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setOrders([]);
        setError(loadError.message || "Could not load your orders.");
      } finally {
        if (refresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [firebaseUid, getAuthToken],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Keep order statuses up to date in real time via socket events.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status, updatedAt }) => {
      setOrders((prev) =>
        prev.map((order) =>
          String(order.id) === String(orderId)
            ? { ...order, status, updatedAt }
            : order,
        ),
      );
    };

    socket.on("order_status_updated", handleStatusUpdate);
    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aDate = new Date(a?.createdAt || a?.created_at || 0).getTime();
      const bDate = new Date(b?.createdAt || b?.created_at || 0).getTime();
      return bDate - aDate;
    });
  }, [orders]);

  const renderOrder = useCallback(({ item }) => <OrderCard item={item} />, []);

  const handleRefresh = useCallback(
    () => loadOrders({ refresh: true }),
    [loadOrders],
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.amber} />
          <Text style={styles.emptySub}>Loading your orders...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Could not load orders</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <Pressable
            style={styles.orderRetryButton}
            onPress={() => loadOrders()}
          >
            <Text style={styles.orderRetryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (!sortedOrders.length) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>
            Your previous orders will appear here once you place one.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={sortedOrders}
        keyExtractor={keyExtractor}
        renderItem={renderOrder}
        contentContainerStyle={styles.ordersListContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <Text style={styles.ordersHeading}>Order History</Text>
        }
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    );
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
                  onPress={() => setIsLocationModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.textDark} />
                </Pressable>
              </View>

              <View style={styles.homeLocationModalRow}>
                <Ionicons name="location" size={18} color={colors.orange} />
                <Text style={styles.homeLocationModalText}>
                  {deliveryLocation}
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        {renderContent()}
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
      fontSize: 12,
      fontWeight: "700",
      color: colors.primaryDeep,
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
    ordersListContent: {
      marginTop: 20,
      paddingTop: 40,
      padding: 16,
      paddingBottom: 120,
      gap: 10,
    },
    ordersHeading: {
      fontFamily: "Nunito_900Black",
      fontSize: 28,
      fontWeight: "900",
      color: colors.textHeading,
      marginBottom: 16,
      paddingTop: 100,
    },
    orderRestaurantGroup: {
      marginTop: 10,
    },
    orderRestaurantText: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 13,
      fontWeight: "800",
      color: colors.textDark,
      marginBottom: 4,
    },
    orderItemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 4,
      marginBottom: 2,
    },
    orderItemName: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      color: colors.textMid,
      flex: 1,
    },
    orderItemQty: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      color: colors.textMid,
      marginLeft: 8,
    },
    orderCardFooter: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    orderIdText: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.textHeading,
      textAlign: "center",
      marginBottom: 10,
    },
    orderCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderBottomWidth: 1,
    },
    paymentStripDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    paymentStripText: {
      fontFamily: "Nunito_700Bold",
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    orderCardContent: {
      padding: 14,
    },
    orderRowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    orderStatusText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.success,
      textTransform: "capitalize",
    },
    orderMetaText: {
      fontFamily: "Inter_400Regular",
      marginTop: 6,
      fontSize: 13,
      color: colors.textMuted,
    },
    orderSummaryText: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMid,
    },
    orderTotalText: {
      fontFamily: "Nunito_900Black",
      marginTop: 8,
      fontSize: 15,
      fontWeight: "900",
      color: colors.textDark,
    },
    orderRetryButton: {
      marginTop: 12,
      backgroundColor: colors.textDark,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    orderRetryButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: "800",
    },
  }),
};
