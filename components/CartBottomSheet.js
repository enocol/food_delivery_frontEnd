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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          dragY.setValue(gesture.dy > 0 ? gesture.dy : gesture.dy * 0.2);
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > 110 || gesture.vy > 1.1;

          if (shouldClose) {
            Animated.timing(dragY, {
              toValue: 420,
              duration: 170,
              useNativeDriver: true,
            }).start(() => {
              dragY.setValue(0);
              onClose();
            });
            return;
          }

          Animated.spring(dragY, {
            toValue: 0,
            damping: 16,
            stiffness: 220,
            mass: 0.85,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            damping: 16,
            stiffness: 220,
            mass: 0.85,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, onClose]
  );

  React.useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      setIsMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 220,
        mass: 0.92,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: 420,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
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
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
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
              <Pressable onPress={onClose} style={styles.sheetCloseButton}>
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
