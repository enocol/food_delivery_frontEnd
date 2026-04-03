import React, { useMemo, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../context/CartContext';
import { toImageSource } from '../utils/imageSource';
import { formatXaf } from '../utils/formatXaf';
import styles from './styles';

export default function CartBottomSheet({ visible, onClose, onCheckout }) {
  const { cartItems, cartTotal, increaseQty, decreaseQty, clearCart } = useCart();
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
    [dragY, onClose, translateY]
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
            const startOffset = Math.max(DISMISS_SETTLE_Y, Math.min(gesture.dy, 120));
            runDismiss(startOffset);
            return;
          }

          dragY.setValue(0);
        },
        onPanResponderTerminate: () => {
          dragY.setValue(0);
        },
      }),
    [dragY, runDismiss]
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
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.sheetHost} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={() => runDismiss()}>
        <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        style={[styles.cartSheet, { transform: [{ translateY: Animated.add(translateY, dragY) }] }]}
        {...panResponder.panHandlers}
      >
        <LinearGradient colors={['#f2f7f2', '#f7f8f1']} style={styles.gradientBackground}>
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
              <Pressable onPress={() => runDismiss()} style={styles.sheetCloseButton}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>

          {entries.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Your cart is empty.</Text>
              <Text style={styles.emptySub}>Add meals from any restaurant to continue.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.cartAwareContent} showsVerticalScrollIndicator={false}>
              <View style={styles.cartListSheet}>
                {entries.map((item) => (
                  <View style={styles.cartItemCard} key={item.id}>
                    <Image source={toImageSource(item.image)} style={styles.cartItemImage} />
                    <View style={styles.cartItemTextWrap}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemRestaurant}>{item.restaurantName}</Text>
                      <Text style={styles.cartItemPrice}>{formatXaf(item.price)}</Text>
                    </View>
                    <View style={styles.qtyControl}>
                      <Pressable style={styles.qtyButton} onPress={() => decreaseQty(item.id)}>
                        <Text style={styles.qtyButtonText}>-</Text>
                      </Pressable>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <Pressable style={styles.qtyButton} onPress={() => increaseQty(item.id)}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.sheetCheckoutBar}>
                <View>
                  <Text style={styles.checkoutLabel}>Total</Text>
                  <Text style={styles.checkoutTotal}>{formatXaf(cartTotal)}</Text>
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
