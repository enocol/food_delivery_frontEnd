import React from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { toImageSource } from "../utils/imageSource";
import { formatXaf } from "../utils/formatXaf";
import sharedStyles from "../components/styles";
import { CARD_MAX_WIDTH, useCompactScreen } from "../utils/responsive";
import * as colors from "../utils/colors";

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    screen: {
      flex: 1,
    },
    // The shared gradientBackground carries a marginTop tuned for the old
    // floating sheet; as a pushed screen the solid header already reserves
    // that space, so it is cancelled here rather than double-counted.
    gradientFill: {
      flex: 1,
      marginTop: 0,
    },
    cartAwareContent: {
      paddingBottom: 16,
    },
    cartSafeArea: {
      flex: 1,
    },
    // Everything stops growing at CARD_MAX_WIDTH and centres, so the rows do
    // not stretch into unreadably wide lines on a tablet.
    contentWidth: {
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
      alignSelf: "center",
    },
    cartHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
      marginBottom: 2,
    },
    clearText: {
      color: colors.primaryDark,
      fontWeight: "700",
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
    cartSectionMeta: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: colors.textCartRestaurant,
    },
    cartSummarySection: {
      marginHorizontal: 14,
      marginBottom: 5,
    },
    // cartSummaryDivider: {
    //   height: 1,
    //   backgroundColor: colors.borderSheet,
    //   opacity: 0.8,
    //   marginBottom: 14,
    // },
    // cartSummaryCard: {
    //   backgroundColor: colors.bgWarm,
    //   borderRadius: 18,
    //   borderWidth: 1,
    //   borderColor: colors.borderSheet,
    //   paddingVertical: 16,
    //   paddingHorizontal: 18,
    //   shadowColor: colors.textDark,
    //   shadowOffset: { width: 0, height: 6 },
    //   shadowOpacity: 0.08,
    //   shadowRadius: 10,
    //   elevation: 4,
    // },
    cartSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    // The label column yields space so a long total keeps its own line.
    cartSummaryLabels: {
      flexShrink: 1,
      marginRight: 12,
    },
    // Borderless rows separated by a hairline, rather than stacked cards.
    cartItemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMid,
    },
    cartItemRowLast: {
      borderBottomWidth: 0,
    },
    cartItemImage: {
      borderRadius: 16,
      backgroundColor: colors.borderMid,
    },
    // Price sits at the top, quantity pill at the bottom; stretching to the
    // row's height is what holds them apart.
    cartItemRight: {
      alignSelf: "stretch",
      minHeight: 72,
      marginLeft: 10,
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexShrink: 0,
    },
    cartItemTextWrap: {
      // flexShrink lets the name column give up width first, so a long dish
      // name can never push the quantity control off a narrow screen.
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      marginLeft: 10,
      marginRight: 8,
    },
    cartItemName: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 16,
      lineHeight: 21,
      color: colors.textItemName,
    },
    cartItemRestaurant: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: colors.textCartRestaurant,
      marginTop: 3,
    },
    cartItemPrice: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: colors.textItemName,
    },
    // Stadium pill: the radius is half the height, so it stays fully rounded
    // if the height ever grows with the font scale.
    qtyControl: {
      flexDirection: "row",
      alignItems: "center",
      // Neutral grey rather than a palette tint: the screen's gradient starts
      // at #f0f9ff, which several palette tints match exactly, and the pill
      // would disappear into it.
      backgroundColor: "#eef1f4",
      borderRadius: 999,
      paddingHorizontal: 4,
      // Never give up width - the text column shrinks instead.
      flexShrink: 0,
    },
    qtyButton: {
      minWidth: 34,
      minHeight: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyText: {
      // minWidth rather than a fixed width, so a two-digit quantity at a
      // large system font scale grows instead of clipping.
      minWidth: 22,
      paddingHorizontal: 2,
      textAlign: "center",
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: colors.textItemName,
    },
    checkoutLabel: {
      fontFamily: "Poppins_400Regular",
      color: colors.textHeading,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    checkoutTotal: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.successDark,
      fontSize: 20,
    },
    // checkoutSummaryHint: {
    //   fontFamily: "Poppins_400Regular",
    //   fontSize: 12,
    //   color: colors.textCartRestaurant,
    //   marginTop: 4,
    // },
    checkoutFooter: {
      paddingTop: 8,
      paddingBottom: 20,
      paddingHorizontal: 16,
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
      backgroundColor: "#ff5a1f",
      // Half the height, so it stays a true stadium if the height grows.
      borderRadius: 999,
      minHeight: 54,
      paddingVertical: 14,
      paddingHorizontal: 20,
      // Fills the footer's content width, capped so it does not become an
      // absurdly wide bar on a tablet.
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 4,
    },
    checkoutText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 17,
    },
    // The shared `centered` style paints a white background, which would hide
    // the gradient behind it on this screen.
    emptyState: {
      backgroundColor: "transparent",
    },
    orderNowButton: {
      marginTop: 20,
      backgroundColor: "#ff5a1f",
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },
    orderNowText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 16,
    },
  }),
};

// `bottomClearance` is extra room under the pinned footer. Zero when pushed as
// its own route; inside MainTabs the floating tab bar overlays the bottom of
// the screen and would otherwise sit on top of the checkout button.
export default function CartScreen({
  bottomClearance = 0,
  // Defaults to the pushed /Cart route's behaviour, since app/Cart.js is a
  // bare re-export and cannot pass props. The tab opts out.
  dismissOnClear = true,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isCompact = useCompactScreen();
  const { cartItems, cartTotal, increaseQty, decreaseQty, clearCart } =
    useCart();
  const entries = Object.values(cartItems);
  const itemCount = entries.reduce((sum, item) => sum + item.qty, 0);
  // Short viewports (iPhone SE and similar) give the thumbnail less room, so
  // it shrinks rather than crowding the name and price beside it.
  const thumbSize = isCompact ? 54 : 66;

  // Emptying the cart leaves nothing to look at, so the pushed /Cart route
  // closes with it - behaviour that used to live in CartContext, back when it
  // owned the open state and could close itself.
  //
  // The tab must not do that. canGoBack() is no help in telling them apart:
  // the tab router answers GO_BACK once another tab has been visited, so it
  // reports true on the Basket tab and back() would jump to Home. Only the
  // route knows which one it is, so it says so.
  const handleClearCart = async () => {
    await clearCart();
    if (dismissOnClear) {
      router.back();
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={colors.gradients.greenSheet}
        style={[styles.gradientBackground, styles.gradientFill]}
      >
        <View style={styles.cartSafeArea}>
          {/* The stack header supplies the title and the back affordance, so
              only the destructive action needs a place of its own here. */}
          {entries.length > 0 ? (
            <View style={[styles.cartHeaderRow, styles.contentWidth]}>
              <Pressable
                onPress={handleClearCart}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            </View>
          ) : null}

          {entries.length === 0 ? (
            <View style={[styles.centered, styles.emptyState]}>
              <Text style={styles.emptyTitle} numberOfLines={2}>
                Your cart is empty.
              </Text>
              <Text style={styles.emptySub}>
                Add meals from any restaurant to continue.
              </Text>
              <Pressable
                style={styles.orderNowButton}
                onPress={() => {
                  router.back();
                  router.navigate("/MainTabs/HomeTab");
                }}
              >
                <Text style={styles.orderNowText}>Order Now</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.cartAwareContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.cartListSheet, styles.contentWidth]}>
                  <View style={styles.cartSectionHeader}>
                    <Text style={styles.cartSectionMeta}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  {entries.map((item, index) => {
                    // decreaseQty already deletes the line at one, so the icon
                    // states what the press will actually do.
                    const removesOnDecrease = item.qty <= 1;
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.cartItemRow,
                          index === entries.length - 1
                            ? styles.cartItemRowLast
                            : null,
                        ]}
                      >
                        <Image
                          source={toImageSource(item.image)}
                          style={[
                            styles.cartItemImage,
                            { width: thumbSize, height: thumbSize },
                          ]}
                        />

                        <View style={styles.cartItemTextWrap}>
                          <Text style={styles.cartItemName} numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text
                            style={styles.cartItemRestaurant}
                            numberOfLines={1}
                          >
                            {item.description || item.restaurantName}
                          </Text>
                        </View>

                        <View style={styles.cartItemRight}>
                          <Text style={styles.cartItemPrice} numberOfLines={1}>
                            {formatXaf(item.price)}
                          </Text>

                          <View style={styles.qtyControl}>
                            <Pressable
                              style={styles.qtyButton}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 2 }}
                              accessibilityRole="button"
                              accessibilityLabel={
                                removesOnDecrease
                                  ? `Remove ${item.name} from cart`
                                  : `Decrease quantity of ${item.name}`
                              }
                              onPress={() => decreaseQty(item.id)}
                            >
                              <Ionicons
                                name={
                                  removesOnDecrease ? "trash-outline" : "remove"
                                }
                                size={removesOnDecrease ? 17 : 20}
                                color={colors.textItemName}
                              />
                            </Pressable>

                            <Text style={styles.qtyText} numberOfLines={1}>
                              {item.qty}
                            </Text>

                            <Pressable
                              style={styles.qtyButton}
                              hitSlop={{ top: 8, bottom: 8, left: 2, right: 8 }}
                              accessibilityRole="button"
                              accessibilityLabel={`Increase quantity of ${item.name}`}
                              onPress={() => increaseQty(item.id)}
                            >
                              <Ionicons
                                name="add"
                                size={20}
                                color={colors.textItemName}
                              />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <View
                style={[
                  styles.checkoutFooter,
                  {
                    paddingBottom:
                      Math.max(insets.bottom + 12, 20) + bottomClearance,
                  },
                ]}
              >
                <View style={[styles.cartSummarySection, styles.contentWidth]}>
                  {/* <View style={styles.cartSummaryCard}> */}
                  <View style={styles.cartSummaryRow}>
                    <View style={styles.cartSummaryLabels}>
                      <Text style={styles.checkoutLabel}>Subtotal</Text>
                      {/* <Text style={styles.checkoutSummaryHint}>
                          {itemCount} {itemCount === 1 ? "item" : "items"} in
                          cart
                        </Text> */}
                    </View>

                    {/* Total price for the items in the cart */}
                    <Text
                      style={styles.checkoutTotal}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {formatXaf(cartTotal)}
                    </Text>
                  </View>
                  {/* </View> */}
                </View>
                <Pressable
                  style={styles.checkoutButton}
                  accessibilityRole="button"
                  onPress={() => {
                    router.back();
                    router.navigate("/Checkout");
                  }}
                >
                  {/* The item count lives in the summary card directly above,
                      so the button carries a single clear action. */}
                  <Text style={styles.checkoutText} numberOfLines={1}>
                    Go to checkout
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
