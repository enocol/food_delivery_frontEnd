import React, { useMemo, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import sharedStyles from "./styles";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    sheetHost: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "flex-end",
    },
    sheetBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#1a120d",
    },
    cartSheet: {
      height: "78%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "#dfe5d9",
    },
    cartAwareContent: {
      paddingBottom: 24,
    },
    sheetHandleWrap: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 2,
    },
    sheetHandle: {
      width: 56,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#c4cbbe",
    },
    cartHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 10,
      marginBottom: 8,
    },
    cartActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cartTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 24,
      fontWeight: "900",
      color: "#202420",
    },
    clearText: {
      color: "#9a2b1d",
      fontWeight: "700",
    },
    sheetCloseButton: {
      backgroundColor: "#ece8de",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    sheetCloseText: {
      color: "#3a352f",
      fontSize: 12,
      fontWeight: "800",
    },
    cartList: {
      paddingHorizontal: 14,
      paddingBottom: 120,
    },
    cartListSheet: {
      paddingHorizontal: 14,
      paddingBottom: 16,
    },
    cartItemCard: {
      backgroundColor: "#fff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#dbe4d7",
      padding: 10,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    cartItemImage: {
      width: 66,
      height: 66,
      borderRadius: 8,
    },
    cartItemTextWrap: {
      flex: 1,
      marginLeft: 10,
    },
    cartItemName: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 14,
      fontWeight: "800",
      color: "#1f221f",
    },
    cartItemRestaurant: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: "#657064",
      marginTop: 2,
    },
    cartItemPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 13,
      color: "#2f6f43",
      fontWeight: "700",
      marginTop: 4,
    },
    qtyControl: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#d0d8cb",
      borderRadius: 12,
      overflow: "hidden",
    },
    qtyButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f6f8f4",
    },
    qtyButtonText: {
      fontWeight: "900",
      color: "#203024",
      fontSize: 16,
    },
    qtyText: {
      width: 28,
      textAlign: "center",
      fontWeight: "700",
      color: "#203024",
    },
    sheetCheckoutBar: {
      marginHorizontal: 12,
      marginBottom: 14,
      backgroundColor: "#1f3b2a",
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    checkoutLabel: {
      fontFamily: "Inter_400Regular",
      color: "#d8e8d2",
      fontSize: 12,
    },
    checkoutTotal: {
      fontFamily: "Nunito_900Black",
      color: "#fff",
      fontSize: 20,
      fontWeight: "900",
    },
    checkoutButton: {
      backgroundColor: "#f7d694",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    checkoutText: {
      fontFamily: "Nunito_800ExtraBold",
      color: "#35210c",
      fontWeight: "800",
    },
    orderNowButton: {
      marginTop: 20,
      backgroundColor: "#bd3f1b",
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },
    orderNowText: {
      fontFamily: "Nunito_800ExtraBold",
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
  }),
};

export default function CartBottomSheet({
  visible,
  onClose,
  onCheckout,
  onOrderNow,
}) {
  const { cartItems, cartTotal, increaseQty, decreaseQty, clearCart } =
    useCart();
  const entries = Object.values(cartItems);
  const [isMounted, setIsMounted] = useState(visible);
  const translateY = React.useRef(new Animated.Value(420)).current;
  const dragY = React.useRef(new Animated.Value(0)).current;
  const MAX_PULL_DOWN = 42;
  const DISMISS_SETTLE_Y = 64;
  const isDismissingRef = React.useRef(false);

  const runDismiss = React.useCallback(
    (startOffset = 0) => {
      if (isDismissingRef.current) {
        return;
      }

      isDismissingRef.current = true;
      dragY.setValue(0);
      translateY.setValue(Math.max(0, startOffset));

      Animated.timing(translateY, {
        toValue: 420,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        isDismissingRef.current = false;
        onClose();
      });
    },
    [dragY, onClose, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          // Keep only a small, direct pull-down follow with no animated bounce.
          const nextDragY = Math.max(0, Math.min(gesture.dy, MAX_PULL_DOWN));
          dragY.setValue(nextDragY);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > 32 || gesture.vy > 1.1;

          if (shouldClose) {
            const startOffset = Math.max(
              DISMISS_SETTLE_Y,
              Math.min(gesture.dy, 120),
            );
            runDismiss(startOffset);
            return;
          }

          dragY.setValue(0);
        },
        onPanResponderTerminate: () => {
          dragY.setValue(0);
        },
      }),
    [dragY, runDismiss],
  );

  React.useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      setIsMounted(true);
      translateY.setValue(420);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    translateY.setValue(420);
    setIsMounted(false);
  }, [visible, translateY, dragY]);

  if (!isMounted) {
    return null;
  }

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, 420],
    outputRange: [0.34, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.sheetHost} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={() => runDismiss()}>
        <Animated.View
          style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
        />
      </Pressable>

      <Animated.View
        style={[
          styles.cartSheet,
          { transform: [{ translateY: Animated.add(translateY, dragY) }] },
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={["#f2f7f2", "#f7f8f1"]}
          style={styles.gradientBackground}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartTitle}>Your Cart</Text>
            <View style={styles.cartActionRow}>
              {entries.length > 0 ? (
                <Pressable onPress={clearCart}>
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => runDismiss()}
                style={styles.sheetCloseButton}
              >
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>

          {entries.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Your cart is empty.</Text>
              <Text style={styles.emptySub}>
                Add meals from any restaurant to continue.
              </Text>
              {onOrderNow ? (
                <Pressable style={styles.orderNowButton} onPress={onOrderNow}>
                  <Text style={styles.orderNowText}>Order Now</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.cartAwareContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cartListSheet}>
                {entries.map((item) => (
                  <View style={styles.cartItemCard} key={item.id}>
                    <Image
                      source={toImageSource(item.image)}
                      style={styles.cartItemImage}
                    />
                    <View style={styles.cartItemTextWrap}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemRestaurant}>
                        {item.restaurantName}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {formatXaf(item.price)}
                      </Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => decreaseQty(item.id)}
                      >
                        <Text style={styles.qtyButtonText}>-</Text>
                      </Pressable>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <Pressable
                        style={styles.qtyButton}
                        onPress={() => increaseQty(item.id)}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sheetCheckoutBar}>
                <View>
                  <Text style={styles.checkoutLabel}>Total</Text>
                  <Text style={styles.checkoutTotal}>
                    {formatXaf(cartTotal)}
                  </Text>
                </View>
                <Pressable
                  style={styles.checkoutButton}
                  onPress={() => {
                    if (onCheckout) {
                      onCheckout();
                    }
                  }}
                >
                  <Text style={styles.checkoutText}>Checkout</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
