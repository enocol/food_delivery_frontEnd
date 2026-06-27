import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import sharedStyles from "./styles";
import * as colors from "../utils/colors";

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
      backgroundColor: colors.bgOverlay,
    },
    cartSheet: {
      height: "100%",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.borderSheet,
    },
    cartAwareContent: {
      paddingBottom: 16,
    },
    cartSafeArea: {
      flex: 1,
    },
    cartHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
      marginBottom: 2,
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
      color: colors.textHeading,
    },
    clearText: {
      color: colors.primaryDark,
      fontWeight: "700",
    },
    sheetCloseButton: {
      backgroundColor: colors.bgCream,
      borderRadius: 18,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.borderSheet,
    },
    cartList: {
      paddingHorizontal: 14,
      paddingBottom: 120,
    },
    cartListSheet: {
      paddingHorizontal: 14,
      paddingBottom: 10,
    },
    cartSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingTop: 6,
    },
    cartSectionTitle: {
      fontFamily: "Nunito_800ExtraBold",
      fontSize: 16,
      fontWeight: "800",
      color: colors.textHeading,
    },
    cartSectionMeta: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textCartRestaurant,
    },
    cartSummarySection: {
      marginHorizontal: 14,
      marginBottom: 16,
    },
    cartSummaryDivider: {
      height: 1,
      backgroundColor: colors.borderSheet,
      opacity: 0.8,
      marginBottom: 14,
    },
    cartSummaryCard: {
      backgroundColor: colors.bgWarm,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderSheet,
      paddingVertical: 16,
      paddingHorizontal: 18,
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    cartSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cartItemCard: {
      backgroundColor: colors.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
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
      color: colors.textItemName,
    },
    cartItemRestaurant: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textCartRestaurant,
      marginTop: 2,
    },
    cartItemPrice: {
      fontFamily: "Nunito_700Bold",
      fontSize: 13,
      color: colors.success,
      fontWeight: "700",
      marginTop: 4,
    },
    qtyControl: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderQty,
      borderRadius: 12,
      overflow: "hidden",
    },
    qtyButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.successTint,
    },
    qtyButtonText: {
      fontWeight: "900",
      color: colors.successDeeper,
      fontSize: 16,
    },
    qtyText: {
      width: 28,
      textAlign: "center",
      fontWeight: "700",
      color: colors.successDeeper,
    },
    checkoutLabel: {
      fontFamily: "Inter_400Regular",
      color: colors.textHeading,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    checkoutTotal: {
      fontFamily: "Nunito_900Black",
      color: colors.successDark,
      fontSize: 20,
      fontWeight: "900",
    },
    checkoutSummaryHint: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: colors.textCartRestaurant,
      marginTop: 4,
    },
    checkoutFooter: {
      paddingTop: 8,
      paddingBottom: 20,
      paddingHorizontal: 12,
      alignItems: "center",
      backgroundColor: colors.bgWarm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSheet,
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 12,
    },
    checkoutButton: {
      backgroundColor: colors.amberLight,
      borderRadius: 14,
      paddingVertical: 14,
      width: "80%",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 4,
    },
    checkoutText: {
      fontFamily: "Nunito_800ExtraBold",
      color: colors.textAmberButton,
      fontSize: 15,
      fontWeight: "800",
    },
    checkoutMetaText: {
      fontFamily: "Inter_400Regular",
      color: colors.textAmberButton,
      fontSize: 11,
      marginTop: 2,
      opacity: 0.78,
    },
    orderNowButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },
    orderNowText: {
      fontFamily: "Nunito_800ExtraBold",
      color: colors.white,
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
  const insets = useSafeAreaInsets();
  const { cartItems, cartTotal, increaseQty, decreaseQty, clearCart } =
    useCart();
  const entries = Object.values(cartItems);
  const itemCount = entries.reduce((sum, item) => sum + item.qty, 0);
  const [isMounted, setIsMounted] = useState(visible);
  const translateY = React.useRef(new Animated.Value(420)).current;
  const isDismissingRef = React.useRef(false);

  const runDismiss = React.useCallback(() => {
    if (isDismissingRef.current) {
      return;
    }

    isDismissingRef.current = true;

    Animated.timing(translateY, {
      toValue: 420,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      isDismissingRef.current = false;
      onClose();
    });
  }, [onClose, translateY]);

  React.useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.setValue(420);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return;
    }

    translateY.setValue(420);
    setIsMounted(false);
  }, [visible, translateY]);

  if (!isMounted) {
    return null;
  }

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, 420],
    outputRange: [0.52, 0],
    extrapolate: "clamp",
  });
  const topInset = Math.max(insets.top, StatusBar.currentHeight || 0);
  const footerTranslateY = translateY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, 28],
    extrapolate: "clamp",
  });
  const footerOpacity = translateY.interpolate({
    inputRange: [0, 180, 420],
    outputRange: [1, 0.92, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.sheetHost} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
      />

      <Animated.View
        style={[styles.cartSheet, { transform: [{ translateY }] }]}
      >
        <LinearGradient
          colors={colors.gradients.greenSheet}
          style={styles.gradientBackground}
        >
          <SafeAreaView style={styles.cartSafeArea} edges={["top"]}>
            <View style={[styles.cartHeaderRow, { paddingTop: topInset + 8 }]}>
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
                  <Ionicons name="close" size={18} color={colors.textClose} />
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
              <>
                <ScrollView
                  contentContainerStyle={styles.cartAwareContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.cartListSheet}>
                    <View style={styles.cartSectionHeader}>
                      <Text style={styles.cartSectionTitle}>Cart Items</Text>
                      <Text style={styles.cartSectionMeta}>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </Text>
                    </View>
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

                  <View style={styles.cartSummarySection}>
                    <View style={styles.cartSummaryDivider} />
                    <View style={styles.cartSummaryCard}>
                      <View style={styles.cartSummaryRow}>
                        <View>
                          <Text style={styles.checkoutLabel}>Total</Text>
                          <Text style={styles.checkoutSummaryHint}>
                            {itemCount} {itemCount === 1 ? "item" : "items"} in
                            cart
                          </Text>
                        </View>
                        <Text style={styles.checkoutTotal}>
                          {formatXaf(cartTotal)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <Animated.View
                  style={[
                    styles.checkoutFooter,
                    {
                      paddingBottom: Math.max(insets.bottom + 12, 20),
                      opacity: footerOpacity,
                      transform: [{ translateY: footerTranslateY }],
                    },
                  ]}
                >
                  <Pressable
                    style={styles.checkoutButton}
                    onPress={() => {
                      if (onCheckout) {
                        onCheckout();
                      }
                    }}
                  >
                    <Text style={styles.checkoutText}>Checkout</Text>
                    <Text style={styles.checkoutMetaText}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
