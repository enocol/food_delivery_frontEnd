import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import styles from "../components/styles";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../utils/orderApi";
import { requestMobileMoneyPayment } from "../utils/fakePaymentApi";
import { formatXaf } from "../utils/formatXaf";
import {
  getCurrentLocation,
  getLocationAddress,
} from "../utils/locationService";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_METHODS = [
  { id: "mtn-momo", label: "MTN MoMo" },
  { id: "orange-mobile-money", label: "Orange Money" },
  { id: "cash", label: "Cash on Delivery" },
];

export default function CheckoutScreen({ navigation }) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { firebaseUid, getAuthToken } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("mtn-momo");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  const itemCount = Object.values(cartItems).reduce(
    (sum, item) => sum + item.qty,
    0,
  );

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
          const address = await getLocationAddress(
            location.latitude,
            location.longitude,
          );
          deliveryAddress = {
            ...location,
            ...address,
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
      console.error("Order creation error:", error);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.checkoutContainer}>
        <LinearGradient colors={["#f2f7f2", "#fffdf7"]} style={styles.screen}>
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={24}
            contentContainerStyle={styles.checkoutScreenContent}
          >
            <View style={styles.paymentPickerCard}>
              <Text style={styles.paymentPickerTitle}>Order summary</Text>
              <Text style={styles.checkoutMetaText}>Items: {itemCount}</Text>
              <Text style={styles.checkoutMetaText}>
                Total to pay: {formatXaf(cartTotal)}
              </Text>
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
                    placeholderTextColor="#7f847d"
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
                {isProcessing ? "Processing..." : "Place Order"}
              </Text>
            </Pressable>
          </KeyboardAwareScrollView>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
