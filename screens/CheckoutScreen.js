import React, { useEffect, useState } from "react";
import {
  Alert,
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
import * as colors from "../utils/colors";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, fetchOrderQuote } from "../apis/orderApi";
import { requestMobileMoneyPayment } from "../apis/fakePaymentApi";
import { formatXaf } from "../utils/formatXaf";
import { getCurrentLocation } from "../utils/locationService";
import { setPostAuthRedirect } from "../utils/postAuthRedirect";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useTransparentHeaderOffset,
  CARD_MAX_WIDTH,
} from "../utils/responsive";

const PAYMENT_METHODS = [
  { id: "mtn-momo", label: "MTN MoMo" },
  { id: "orange-mobile-money", label: "Orange Money" },
  { id: "cash", label: "Cash on Delivery" },
];

export default function CheckoutScreen({ navigation: navigationProp }) {
  const routeNavigation = useNavigation();
  const navigation = navigationProp ?? routeNavigation;
  const { cartItems, cartTotal, clearCart } = useCart();
  const {
    firebaseUid,
    userPhone,
    getAuthToken,
    emailVerified,
    refreshVerification,
  } = useAuth();
  const router = useRouter();
  const needsAccount = !firebaseUid;
  const needsVerification = Boolean(firebaseUid) && !emailVerified;
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("mtn-momo");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const headerOffset = useTransparentHeaderOffset();

  const itemCount = Object.values(cartItems).reduce(
    (sum, item) => sum + item.qty,
    0,
  );

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

  const formatCameroonPhoneInput = (rawValue) => {
    const digits = rawValue.replace(/\D/g, "");
    const hasCountryCode = digits.startsWith("237");
    const local = hasCountryCode ? digits.slice(3, 12) : digits.slice(0, 9);

    if (!local) {
      return hasCountryCode ? "+237 " : "";
    }

    const p1 = local.slice(0, 3);
    const p2 = local.slice(3, 6);
    const p3 = local.slice(6, 9);
    const grouped = [p1, p2, p3].filter(Boolean).join(" ");

    return hasCountryCode ? `+237 ${grouped}` : grouped;
  };

  const validateCameroonPhone = (rawPhone, paymentMethod) => {
    const digits = rawPhone.replace(/\D/g, "");
    const local = digits.startsWith("237") ? digits.slice(3) : digits;
    const isValid = /^6\d{8}$/.test(local);

    if (!isValid) {
      return {
        isValid: false,
        message:
          "Enter a valid Cameroon number (e.g. 6XXXXXXXX or +2376XXXXXXXX).",
      };
    }

    if (paymentMethod === "mtn-momo" && !/^6[5-8]/.test(local)) {
      return {
        isValid: false,
        message:
          "MTN MoMo requires an MTN line (typically starting with 65, 66, 67, or 68).",
      };
    }

    if (paymentMethod === "orange-mobile-money" && !/^69/.test(local)) {
      return {
        isValid: false,
        message:
          "Orange Money requires an Orange line (typically starting with 69).",
      };
    }

    return { isValid: true };
  };

  const detectNetworkFromPhone = (rawPhone) => {
    const digits = rawPhone.replace(/\D/g, "");
    const local = digits.startsWith("237") ? digits.slice(3) : digits;

    if (!/^6\d{8}$/.test(local)) {
      return null;
    }

    if (/^69/.test(local)) {
      return "Orange";
    }

    if (/^6[5-8]/.test(local)) {
      return "MTN";
    }

    return "Unknown";
  };

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

    if (selectedPaymentMethod !== "cash") {
      const validation = validateCameroonPhone(
        mobileMoneyPhone,
        selectedPaymentMethod,
      );
      if (!validation.isValid) {
        setPhoneError(validation.message);
        return;
      }
    }

    const orderRef = `ORDER-${Date.now()}`;
    const normalizedPhone = mobileMoneyPhone.replace(/\D/g, "");

    try {
      setPhoneError("");
      setIsProcessing(true);
      setStatusMessage("Starting payment...");

      let paymentResult;

      if (selectedPaymentMethod === "cash") {
        paymentResult = {
          ok: true,
          provider: "cash",
          transactionId: `COD-${Date.now()}`,
          paidAt: null,
        };
      } else {
        const provider =
          selectedPaymentMethod === "mtn-momo" ? "mtn" : "orange";
        setStatusMessage(
          `Sending ${provider.toUpperCase()} payment request...`,
        );

        paymentResult = await requestMobileMoneyPayment({
          provider,
          phone: normalizedPhone,
          amountXaf: cartTotal,
          orderRef,
        });
      }

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

      const paymentMethodLabel =
        PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod)?.label ||
        selectedPaymentMethod;

      const orderRecord = await createOrder(token, firebaseUid, {
        orderRef,
        paymentMethod: selectedPaymentMethod,
        paymentMethodCode: selectedPaymentMethod,
        paymentMethodLabel,
        payment: paymentResult,
        customerPhone: normalizedPhone || null,
        notifyPhone:
          userPhone ||
          (normalizedPhone
            ? `+237${normalizedPhone.replace(/^237/, "")}`
            : null),
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

      setStatusMessage("Order saved successfully.");
      Alert.alert(
        "Order placed",
        `Payment confirmed and order saved.\nOrder ID: ${orderRecord.id || orderRecord.orderRef}\nTransaction: ${paymentResult.transactionId}`,
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
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <View style={styles.checkoutContainer}>
        <ScreenGradient style={styles.screen}>
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={24}
            contentContainerStyle={[
              styles.checkoutScreenContent,
              { paddingTop: headerOffset },
            ]}
          >
            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>Order summary</Text>
              {quoteLoading ? (
                <Text style={styles.checkoutMetaText}>
                  Loading order summary...
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
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.quoteTotalLabel}>Total</Text>
                    <Text style={styles.quoteTotalValue}>
                      {formatXaf(quote.total)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>
                Choose payment method
              </Text>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPaymentMethod === method.id;
                return (
                  <Pressable
                    key={method.id}
                    style={styles.paymentOptionRow}
                    onPress={() => {
                      setSelectedPaymentMethod(method.id);
                      if (method.id === "cash") {
                        setPhoneError("");
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.paymentRadioOuter,
                        isSelected ? styles.paymentRadioOuterActive : null,
                      ]}
                    >
                      {isSelected ? (
                        <View style={styles.paymentRadioInner} />
                      ) : null}
                    </View>
                    <Text style={styles.paymentOptionLabel}>
                      {method.label}
                    </Text>
                  </Pressable>
                );
              })}

              {selectedPaymentMethod !== "cash" ? (
                <>
                  <TextInput
                    value={mobileMoneyPhone}
                    onChangeText={(value) => {
                      setMobileMoneyPhone(formatCameroonPhoneInput(value));
                      if (phoneError) {
                        setPhoneError("");
                      }
                    }}
                    placeholder="Phone number (e.g. +237 6XX XXX XXX)"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                    style={styles.paymentPhoneInput}
                  />
                  {detectNetworkFromPhone(mobileMoneyPhone) ? (
                    <Text style={styles.paymentNetworkHint}>
                      Detected network:{" "}
                      {detectNetworkFromPhone(mobileMoneyPhone)}
                    </Text>
                  ) : null}
                  {phoneError ? (
                    <Text style={styles.paymentPhoneError}>{phoneError}</Text>
                  ) : null}
                </>
              ) : null}
            </View>

            {statusMessage ? (
              <Text style={styles.checkoutStatusText}>{statusMessage}</Text>
            ) : null}

            <Pressable
              style={[
                styles.checkoutScreenCta,
                isProcessing ? styles.checkoutScreenCtaDisabled : null,
              ]}
              onPress={placeOrder}
              disabled={isProcessing}
            >
              <Text style={styles.checkoutScreenCtaText}>
                {isProcessing
                  ? "Processing..."
                  : needsAccount
                    ? "Sign in to order"
                    : needsVerification
                      ? "Verify email to order"
                      : "Place Order"}
              </Text>
            </Pressable>
          </KeyboardAwareScrollView>
        </ScreenGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    safeArea: {
      flex: 1,
      marginHorizontal: 12,
      borderRadius: 18,
      padding: 14,
    },
    checkoutContainer: {
      flex: 1,
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
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
      marginTop: 6,
    },
    quoteTotalLabel: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textHeading,
    },
    quoteTotalValue: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.success,
    },
    checkoutBar: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 16,
      backgroundColor: colors.successDark,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    checkoutLabel: {
      fontFamily: "Poppins_400Regular",
      color: colors.successText,
      fontSize: 12,
    },
    checkoutTotal: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 20,
    },
    checkoutButton: {
      backgroundColor: colors.amberLight,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    checkoutText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.textAmberButton,
    },
    checkoutScreenCta: {
      marginHorizontal: 8,
      marginTop: 6,
      borderRadius: 14,
      backgroundColor: colors.successDark,
      paddingVertical: 14,
      alignItems: "center",
    },
    checkoutScreenCtaDisabled: {
      opacity: 0.6,
    },
    checkoutScreenCtaText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 15,
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
    paymentOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    paymentRadioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    paymentRadioOuterActive: {
      borderColor: colors.primary,
    },
    paymentRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    paymentOptionLabel: {
      fontSize: 14,
      color: colors.textPaymentLabel,
      fontWeight: "700",
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
    paymentNetworkHint: {
      marginTop: 6,
      fontSize: 12,
      color: colors.success,
      fontWeight: "700",
    },
  }),
};
