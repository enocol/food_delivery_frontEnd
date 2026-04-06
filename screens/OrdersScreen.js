import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import useRootCartHeader from "../components/useRootCartHeader";
import styles from "../components/styles";
import { formatXaf } from "../utils/formatXaf";
import { fetchCustomerOrders } from "../apis/orderApi";

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

export default function OrdersScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const { firebaseUid, getAuthToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useRootCartHeader(navigation, cartCount, "Orders", openCartSheet, {
    headerHeight: 100,
    headerBackgroundColor: "orange",
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

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aDate = new Date(a?.createdAt || a?.created_at || 0).getTime();
      const bDate = new Date(b?.createdAt || b?.created_at || 0).getTime();
      return bDate - aDate;
    });
  }, [orders]);

  const renderOrder = ({ item }) => {
    const createdAt = item?.createdAt || item?.created_at;
    const itemCount = getItemCount(item);
    const total = getOrderTotal(item);
    const status = item?.status || item?.payment?.status || "confirmed";

    return (
      <View>
        <View style={styles.orderCard}>
          <View style={styles.orderRowBetween}>
            <Text style={styles.orderMetaText}>{toDateLabel(createdAt)}</Text>
            <Text style={styles.orderStatusText}>{status}</Text>
          </View>

          <View style={styles.orderRowBetween}>
            <Text style={styles.orderSummaryText}>{itemCount} item(s)</Text>
            <Text style={styles.orderTotalText}>{formatXaf(total)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d97706" />
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
        keyExtractor={(item, index) =>
          String(item?.id || item?.orderRef || index)
        }
        renderItem={renderOrder}
        contentContainerStyle={styles.ordersListContent}
        refreshing={refreshing}
        onRefresh={() => loadOrders({ refresh: true })}
        ListHeaderComponent={
          <Text style={styles.ordersHeading}>Order History</Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#fff8f0", "#f8efe8"]}
        style={styles.gradientBackground}
      >
        {renderContent()}
      </LinearGradient>
    </SafeAreaView>
  );
}
