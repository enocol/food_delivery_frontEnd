import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import sharedStyles from "../components/styles";
import ScreenGradient from "../components/ScreenGradient";
import DeliveryNotesSheet from "../components/DeliveryNotesSheet";
import DeliveryMapPreview from "../components/DeliveryMapPreview";
import * as colors from "../utils/colors";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useDeliveryLocation } from "../context/LocationContext";
import { createOrder, fetchOrderQuote } from "../apis/orderApi";
import { requestMobileMoneyPayment } from "../apis/fakePaymentApi";
import { formatXaf } from "../utils/formatXaf";
import { getCurrentLocation } from "../utils/locationService";
import { setPostAuthRedirect } from "../utils/postAuthRedirect";
import { useCheckoutDraft } from "../context/CheckoutDraftContext";
import {
  formatCameroonPhoneInput,
  paymentMethodLabel,
  validateCameroonPhone,
} from "../utils/cameroonPhone";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useTransparentHeaderOffset,
  CARD_MAX_WIDTH,
} from "../utils/responsive";

// First-frame fallback only - the footer reports its real height on layout.
// 12 top padding + the total row + the 54pt pill + 12 bottom padding, which
// the scroll view reserves so its last card clears the pinned bar.
const FOOTER_CLEARANCE = 115;

export default function CheckoutScreen({ navigation: navigationProp }) {
  const routeNavigation = useNavigation();
  const navigation = navigationProp ?? routeNavigation;
  const { cartItems, cartTotal, clearCart } = useCart();
  const {
    user,
    userEmail,
    firebaseUid,
    getAuthToken,
    emailVerified,
    refreshVerification,
  } = useAuth();
  // Already resolved once for the header labels elsewhere in the app, so the
  // address and coordinates are read from here rather than looked up again.
  // Aliased: `deliveryAddress` already means the coordinate payload sent to
  // the backend further down, and this is the reverse-geocoded street address.
  const {
    deliveryLocation,
    deliveryAddress: locationAddress,
    deliveryCoords,
    refreshLocation,
  } = useDeliveryLocation();
  const router = useRouter();
  const needsAccount = !firebaseUid;
  const needsVerification = Boolean(firebaseUid) && !emailVerified;
  // The wallet is chosen on /SelectPaymentMethod and the note in a sheet, but
  // both live in the draft so they survive a restart and clear together once
  // the order is placed. No default payment method, so the row starts empty
  // and Place Order stays disabled until the customer picks one.
  const {
    paymentMethod,
    paymentPhone,
    hasPaymentMethod,
    deliveryNotes,
    setDeliveryNotes,
    clearCheckoutDraft,
  } = useCheckoutDraft();
  const [phoneError, setPhoneError] = useState("");
  // The wallet paying and the person meeting the rider are usually the same,
  // so this mirrors the payment number until the customer edits it - ordering
  // on someone else's behalf is the case that needs them to differ.
  const [contactPhone, setContactPhone] = useState("");
  const [contactPhoneEdited, setContactPhoneEdited] = useState(false);
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [isNotesSheetOpen, setNotesSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const headerOffset = useTransparentHeaderOffset();
  const insets = useSafeAreaInsets();
  // The pinned footer steps aside while typing. On Android the window resizes,
  // so it would otherwise sit squashed on top of the keyboard; on iOS the
  // keyboard covers it anyway. Hiding it is consistent on both.
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  // Measured rather than assumed: the footer grew a total row, and a constant
  // that drifts out of date leaves the last card trapped behind the bar.
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    // iOS gets the "will" events so the footer leaves in step with the
    // keyboard; Android only reports "did".
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardOpen(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // The payment number is typed on another screen now, so instead of mirroring
  // it keystroke by keystroke, the contact number is seeded from it on return -
  // still only while the customer has not typed their own.
  useEffect(() => {
    if (paymentPhone && !contactPhoneEdited) {
      setContactPhone(paymentPhone);
      setContactPhoneError("");
    }
  }, [contactPhoneEdited, paymentPhone]);

  const itemCount = Object.values(cartItems).reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  // The quote effect below only fetches for a signed-in user with a non-empty
  // cart, so gating on it here too keeps the "Place Order" button usable for
  // guests (sign-in prompt) and empty carts, which never get a quote.
  const isQuotePending = itemCount > 0 && !needsAccount && !quote;

  // The account holds a display name from sign-up and the email it was created
  // with; the local part of the email stands in when the name was never set.
  const customerName =
    user?.displayName?.trim() ||
    (userEmail ? userEmail.split("@")[0] : "") ||
    "Guest";

  // Street first, town underneath - the same split the rider reads it in. The
  // one-line label is the fallback for when reverse geocoding returned nothing
  // structured, or nothing at all.
  const addressTitle =
    locationAddress?.street || locationAddress?.name || deliveryLocation;
  const addressMeta =
    [locationAddress?.city, locationAddress?.region]
      .filter(Boolean)
      .join(", ") ||
    [locationAddress?.country, locationAddress?.postalCode]
      .filter(Boolean)
      .join(" ");

  // Checkout resolves its own fix for the quote, which is the fresher of the
  // two; the session-wide one covers the window before that call returns.
  const mapCoords = userLocation || deliveryCoords;

  // Guests and unverified users keep a live button - it routes them to sign in
  // or verify - so only the ready-to-pay case is gated on having a wallet.
  const needsPaymentMethod =
    !needsAccount && !needsVerification && !hasPaymentMethod;
  const isCtaDisabled = isProcessing || isQuotePending || needsPaymentMethod;

  // Fetches the priced order summary (restaurant, per-item price, delivery
  // fee, total) as soon as the customer lands on checkout. The endpoint reads
  // the cart server-side from the auth token, but still requires a delivery
  // address to price the delivery fee - so location is resolved here first
  // and reused by placeOrder below instead of being requested twice.
  useEffect(() => {
    if (itemCount === 0 || needsAccount) {
      return;
    }

    let cancelled = false;

    (async () => {
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const location = await getCurrentLocation();
        const deliveryAddress = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        if (cancelled) {
          return;
        }
        setUserLocation(deliveryAddress);

        const token = await getAuthToken();
        const data = await fetchOrderQuote(token, firebaseUid, deliveryAddress);
        if (!cancelled) {
          setQuote(data);
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteError(error.message || "Could not load your order summary.");
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeOrder = async () => {
    if (isProcessing) {
      return;
    }

    if (itemCount === 0) {
      Alert.alert(
        "Cart empty",
        "Add at least one item before placing your order.",
      );
      navigation.goBack();
      return;
    }

    // The account requirement is enforced here rather than on screen entry, so
    // a guest sees the full total before being asked to sign up — seeing the
    // real number is what motivates finishing. Checked before phone validation
    // so a guest is not told their number is wrong first.
    //
    if (needsAccount) {
      setPostAuthRedirect("/Checkout");
      router.navigate("/Auth");
      return;
    }

    // Signed in but the address is unproven. The backend rejects these too, by
    // reading the email_verified claim off the ID token - this is the friendly
    // half of that rule, not the enforcement.
    if (needsVerification) {
      router.navigate("/VerifyEmail");
      return;
    }

    // The number was already validated on the selection screen; re-checking
    // here guards the case where it never happened at all.
    if (!hasPaymentMethod) {
      setPhoneError("Choose how you would like to pay.");
      return;
    }

    const validation = validateCameroonPhone(paymentPhone, paymentMethod);
    if (!validation.isValid) {
      setPhoneError(validation.message);
      return;
    }

    // Called with no payment method, so this checks the number's shape only -
    // the line the rider calls has no reason to match the wallet's network.
    const contactValidation = validateCameroonPhone(contactPhone);
    if (!contactValidation.isValid) {
      setContactPhoneError(contactValidation.message);
      return;
    }

    const orderRef = `ORDER-${Date.now()}`;
    const normalizedPhone = paymentPhone.replace(/\D/g, "");
    const contactPhoneE164 = `+237${contactPhone
      .replace(/\D/g, "")
      .replace(/^237/, "")}`;

    try {
      setPhoneError("");
      setContactPhoneError("");
      setIsProcessing(true);

      const provider = paymentMethod === "mtn-momo" ? "mtn" : "orange";
      setStatusMessage(`Sending ${provider.toUpperCase()} payment request...`);

      const paymentResult = await requestMobileMoneyPayment({
        provider,
        phone: normalizedPhone,
        amountXaf: cartTotal,
        orderRef,
      });

      if (!paymentResult.ok) {
        Alert.alert(
          "Payment failed",
          paymentResult.message || "Unable to complete payment.",
        );
        setStatusMessage("Payment failed.");
        return;
      }

      setStatusMessage("Saving order to database...");
      const token = await getAuthToken();

      let deliveryAddress = userLocation;
      if (!deliveryAddress) {
        setStatusMessage("Getting delivery location...");
        try {
          const location = await getCurrentLocation();
          deliveryAddress = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          setUserLocation(deliveryAddress);
        } catch (locationError) {
          Alert.alert(
            "Location error",
            "Could not get your current location. Please enable location services and try again.",
          );
          setStatusMessage("Location error. Please try again.");
          return;
        }
      }

      const orderRecord = await createOrder(token, firebaseUid, {
        orderRef,
        paymentMethod,
        paymentMethodCode: paymentMethod,
        paymentMethodLabel: paymentMethodLabel(paymentMethod),
        payment: paymentResult,
        customerPhone: normalizedPhone || null,
        // Who the rider calls, kept separate from the wallet that was charged.
        contactPhone: contactPhoneE164,
        deliveryNotes: deliveryNotes.trim() || null,
        notifyPhone: contactPhoneE164,
        deliveryAddress,
        totals: {
          itemCount,
          cartTotal,
        },
        items: Object.values(cartItems).map((item) => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          restaurant_id: item.restaurantId,
          restaurantName: item.restaurantName,
        })),
      });

      clearCart();
      // The draft has served its purpose, so the wallet and note are dropped
      // from storage too - this is the one point where they stop persisting.
      await clearCheckoutDraft();

      setStatusMessage("Order saved successfully.");
      Alert.alert(
        "Order placed",
        `Payment confirmed and order saved.\nOrder ID: ${
          orderRecord?.id || orderRef
        }\nTransaction: ${paymentResult.transactionId}`,
      );
      navigation.navigate("MainTabs");
    } catch (error) {
      if (__DEV__) {
        console.error("Order creation error:", error);
      }

      // The backend enforces the same rule by reading the email_verified claim
      // off the ID token. Reaching here means our local flag was stale - the
      // token had not refreshed yet, or verification happened on another
      // device. Re-read the real state and send them to verify rather than
      // showing a raw error they cannot act on.
      if (error?.response?.code === "EMAIL_NOT_VERIFIED") {
        await refreshVerification();
        setStatusMessage("");
        router.navigate("/VerifyEmail");
        return;
      }

      Alert.alert(
        "Checkout error",
        error.message || "Something went wrong while processing your order.",
      );
      setStatusMessage("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // "bottom" is deliberately not an edge: the pinned footer applies that
    // inset itself, so its white reaches the screen edge instead of leaving a
    // gradient strip beneath it.
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.checkoutContainer}>
        <ScreenGradient style={styles.screen}>
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={24}
            // Takes the space left over by the pinned footer. Without this the
            // scroll view sizes to its content and pushes the footer off-screen
            // instead of stopping short of it.
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.checkoutScreenContent,
              {
                paddingTop: headerOffset,
                // Clears the pinned footer so the last card is not trapped
                // behind it; no clearance needed once the footer steps aside.
                // The measured height already includes the footer's own
                // bottom inset, so it is not added again here.
                paddingBottom: isKeyboardOpen
                  ? 28
                  : footerHeight || FOOTER_CLEARANCE + insets.bottom,
              },
            ]}
          >
            {/* Who the order is for and where it is going, before anything
                that can be changed further down. */}
            <View style={styles.paymentPickerCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconTile}>
                  <Ionicons name="person-outline" size={20} color="#ff5a1f" />
                </View>

                <View style={styles.detailRowText}>
                  <Text style={styles.detailRowTitle} numberOfLines={1}>
                    {customerName}
                  </Text>
                  <Text style={styles.detailRowMeta} numberOfLines={1}>
                    {userEmail || "Sign in to confirm your order"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconTile}>
                  <Ionicons name="location-outline" size={20} color="#ff5a1f" />
                </View>

                <View style={styles.detailRowText}>
                  <Text style={styles.detailRowTitle} numberOfLines={2}>
                    {addressTitle}
                  </Text>
                  {addressMeta ? (
                    <Text style={styles.detailRowMeta} numberOfLines={1}>
                      {addressMeta}
                    </Text>
                  ) : null}
                </View>

                {/* A stale or failed fix is the one thing the customer can
                    actually fix from here, so the row offers a retry rather
                    than a chevron to nowhere. */}
                <Pressable
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh delivery location"
                  onPress={refreshLocation}
                >
                  <Ionicons
                    name="refresh"
                    size={19}
                    color={colors.textHeading}
                  />
                </Pressable>
              </View>

              <DeliveryMapPreview
                latitude={mapCoords?.latitude}
                longitude={mapCoords?.longitude}
                style={styles.detailMap}
              />
            </View>

            <View style={styles.paymentPickerCard}>
              <Pressable
                style={styles.notesRow}
                accessibilityRole="button"
                accessibilityLabel={
                  deliveryNotes
                    ? `Delivery notes: ${deliveryNotes}. Edit`
                    : "Add delivery notes"
                }
                onPress={() => setNotesSheetOpen(true)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={26}
                  color="#ff5a1f"
                />

                <View style={styles.notesRowText}>
                  {deliveryNotes ? (
                    <>
                      <Text style={styles.notesRowTitle} numberOfLines={1}>
                        Delivery notes
                      </Text>
                      <Text style={styles.notesRowMeta} numberOfLines={2}>
                        {deliveryNotes}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.notesRowPlaceholder}>
                      Add delivery notes
                    </Text>
                  )}
                </View>

                <Ionicons
                  name={deliveryNotes ? "pencil" : "add-circle-outline"}
                  size={deliveryNotes ? 20 : 26}
                  color={colors.textHeading}
                />
              </Pressable>
            </View>

            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>
                How would you like to pay?
              </Text>

              <Pressable
                style={styles.paymentSummaryRow}
                accessibilityRole="button"
                accessibilityLabel={
                  hasPaymentMethod
                    ? `Payment method, ${paymentMethodLabel(
                        paymentMethod,
                      )} ${paymentPhone}. Change`
                    : "Select payment method"
                }
                onPress={() => router.navigate("/SelectPaymentMethod")}
              >
                <View style={styles.paymentWalletTile}>
                  <Ionicons name="wallet" size={19} color={colors.white} />
                </View>

                <View style={styles.paymentSummaryText}>
                  {hasPaymentMethod ? (
                    <>
                      <Text
                        style={styles.paymentSummaryTitle}
                        numberOfLines={1}
                      >
                        {paymentMethodLabel(paymentMethod)}
                      </Text>
                      <Text style={styles.paymentSummaryMeta} numberOfLines={1}>
                        {paymentPhone}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.paymentSummaryPlaceholder}>
                      Select payment method
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textHeading}
                />
              </Pressable>

              {phoneError ? (
                <Text style={styles.paymentPhoneError}>{phoneError}</Text>
              ) : null}
            </View>

            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>Delivery contact</Text>

              <Text style={styles.fieldLabel}>
                Number the rider should call
              </Text>
              <TextInput
                value={contactPhone}
                onChangeText={(value) => {
                  setContactPhone(formatCameroonPhoneInput(value));
                  setContactPhoneEdited(true);
                  if (contactPhoneError) {
                    setContactPhoneError("");
                  }
                }}
                placeholder="Phone number (e.g. +237 6XX XXX XXX)"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                style={styles.paymentPhoneInput}
              />
              <Text style={styles.fieldHint}>
                Change this if someone else is receiving the order.
              </Text>
              {contactPhoneError ? (
                <Text style={styles.paymentPhoneError}>
                  {contactPhoneError}
                </Text>
              ) : null}
            </View>

            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>Order summary</Text>
              {quoteLoading ? (
                <Text style={styles.checkoutMetaText}>
                  Loading order summary, please wait...
                </Text>
              ) : quoteError ? (
                <Text style={styles.paymentPhoneError}>{quoteError}</Text>
              ) : quote ? (
                <>
                  <Text style={styles.quoteRestaurantName}>
                    {quote.restaurant?.name}
                  </Text>
                  {quote.items.map((item) => (
                    <View style={styles.quoteItemRow} key={item.menuItemId}>
                      <Text style={styles.quoteItemName}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={styles.quoteItemPrice}>
                        {formatXaf(item.unitPrice)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.quoteDivider} />

                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.checkoutMetaText}>Subtotal</Text>
                    <Text style={styles.checkoutMetaText}>
                      {formatXaf(quote.subtotal)}
                    </Text>
                  </View>
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.checkoutMetaText}>Delivery fee</Text>
                    <Text style={styles.checkoutMetaText}>
                      {formatXaf(quote.deliveryFee)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {statusMessage ? (
              <Text style={styles.checkoutStatusText}>{statusMessage}</Text>
            ) : null}
          </KeyboardAwareScrollView>

          {/* Sibling of the scroll view, not a child, so it stays put while
              the content moves underneath it. */}
          {isKeyboardOpen ? null : (
            <View
              onLayout={(event) =>
                setFooterHeight(event.nativeEvent.layout.height)
              }
              style={[styles.ctaFooter, { paddingBottom: insets.bottom + 12 }]}
            >
              {/* Stays in the layout before the quote lands, so the pinned
                  footer does not change height under the customer's thumb.
                  The dash is honest: the delivery fee is priced server-side,
                  so there is no total to show until the quote returns. */}
              <View style={[styles.quoteSummaryRow, styles.footerTotalRow]}>
                <Text style={styles.quoteTotalLabel}>Total</Text>
                <Text style={styles.quoteTotalValue}>
                  {quote ? formatXaf(quote.total) : "—"}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.checkoutScreenCta,
                  isCtaDisabled ? styles.checkoutScreenCtaDisabled : null,
                ]}
                onPress={placeOrder}
                disabled={isCtaDisabled}
                accessibilityRole="button"
              >
                <Text style={styles.checkoutScreenCtaText} numberOfLines={1}>
                  {isProcessing
                    ? "Processing..."
                    : needsAccount
                      ? "Sign in to order"
                      : needsVerification
                        ? "Verify email to order"
                        : "Place Order"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScreenGradient>
      </View>

      <DeliveryNotesSheet
        visible={isNotesSheetOpen}
        value={deliveryNotes}
        onClose={() => setNotesSheetOpen(false)}
        onSave={(note) => {
          setDeliveryNotes(note);
          setNotesSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    safeArea: {
      flex: 1,
      // marginHorizontal: 12,
      borderRadius: 18,
    },
    checkoutContainer: {
      flex: 1,
      width: "100%",
      // maxWidth: CARD_MAX_WIDTH,
      alignSelf: "center",
    },
    checkoutScreenContent: {
      paddingHorizontal: 14,
      paddingBottom: 28,
    },
    checkoutMetaText: {
      fontSize: 14,
      color: colors.textGreenBody,
      marginTop: 6,
      fontWeight: "700",
    },
    quoteRestaurantName: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textHeading,
      marginTop: 4,
      marginBottom: 8,
    },
    quoteItemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    quoteItemName: {
      flex: 1,
      fontSize: 14,
      color: colors.textGreenBody,
      marginRight: 8,
    },
    quoteItemPrice: {
      fontSize: 14,
      color: colors.textGreenBody,
      fontWeight: "700",
    },
    quoteDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 10,
    },
    quoteSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 6,
    },
    quoteTotalLabel: {
      fontFamily: "Poppins_400Regular",
      color: colors.textHeading,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    quoteTotalValue: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.success,
    },
    scrollArea: {
      flex: 1,
    },
    // quoteSummaryRow's own marginTop is enough above; this is the gap down
    // to the button, which otherwise sits flush against the total.
    footerTotalRow: {
      marginBottom: 10,
    },
    // Pinned bar behind the CTA. White, as the content scrolling beneath it
    // needs an opaque surface to disappear under.
    ctaFooter: {
      paddingTop: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      shadowColor: colors.textDark,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 12,
    },
    checkoutScreenCta: {
      // The footer supplies the horizontal inset now, so the button simply
      // stretches to its content width.
      marginTop: 0,
      // Half the height, so it stays a true stadium if the height grows.
      borderRadius: 999,
      // Matches the cart's "Go to checkout" pill: one primary action, one look.
      backgroundColor: "#ff5a1f",
      minHeight: 54,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    checkoutScreenCtaDisabled: {
      // Not lower: white text on a paler fill stops being readable.
      opacity: 0.6,
    },
    checkoutScreenCtaText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 17,
    },
    checkoutStatusText: {
      marginHorizontal: 10,
      marginTop: 4,
      marginBottom: 4,
      fontSize: 13,
      color: colors.textGreenBody,
      fontWeight: "700",
    },
    paymentPickerCard: {
      justifyContent: "center",
      marginBottom: 14,
      marginTop: 29,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 14,
      padding: 12,
      flex: 1,
    },
    paymentPickerTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textHeading,
      marginBottom: 10,
    },
    // Name/email and address rows at the top of checkout. Shares the row
    // metrics of the payment and notes rows below so the four read as one
    // column, with a tinted tile instead of the payment row's solid one.
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      minHeight: 56,
    },
    detailIconTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.bgPaymentOption,
      borderWidth: 1,
      borderColor: colors.borderPaymentOption,
      alignItems: "center",
      justifyContent: "center",
    },
    detailRowText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      marginRight: 8,
    },
    detailRowTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 15,
      color: colors.textHeading,
    },
    detailRowMeta: {
      fontSize: 13,
      color: colors.textCartRestaurant,
      marginTop: 2,
    },
    detailDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
    },
    detailMap: {
      marginTop: 10,
    },
    // Collapsed row standing in for the old inline notes field. The plus
    // becomes a pencil once a note exists, so the affordance matches what the
    // tap will actually do.
    notesRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      minHeight: 56,
    },
    notesRowText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 14,
      marginRight: 8,
    },
    notesRowPlaceholder: {
      fontSize: 15,
      color: colors.textPaymentLabel,
    },
    notesRowTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 15,
      color: colors.textHeading,
    },
    notesRowMeta: {
      fontSize: 13,
      color: colors.textCartRestaurant,
      marginTop: 2,
    },
    // Collapsed row standing in for the old radio list: wallet tile, the
    // chosen method over its number, and a chevron into /SelectPaymentMethod.
    paymentSummaryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      minHeight: 56,
    },
    paymentWalletTile: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: "#ff5a1f",
      alignItems: "center",
      justifyContent: "center",
    },
    paymentSummaryText: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      marginRight: 8,
    },
    paymentSummaryPlaceholder: {
      fontSize: 15,
      color: colors.textPaymentLabel,
    },
    paymentSummaryTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 15,
      color: colors.textHeading,
    },
    paymentSummaryMeta: {
      fontSize: 13,
      color: colors.textCartRestaurant,
      marginTop: 2,
    },
    fieldLabel: {
      marginTop: 10,
      fontSize: 13,
      fontWeight: "700",
      color: colors.textHeading,
    },
    fieldHint: {
      marginTop: 6,
      fontSize: 12,
      color: colors.textMuted,
    },
    paymentPhoneInput: {
      marginTop: 8,
      backgroundColor: colors.bgPaymentOption,
      borderWidth: 1,
      borderColor: colors.borderPaymentOption,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textHeading,
    },
    paymentPhoneError: {
      marginTop: 6,
      fontSize: 12,
      color: colors.dangerText,
      fontWeight: "700",
    },
  }),
};
