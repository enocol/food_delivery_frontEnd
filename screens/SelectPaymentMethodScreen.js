import React, { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import sharedStyles from "../components/styles";
import ScreenGradient from "../components/ScreenGradient";
import * as colors from "../utils/colors";
import { useCheckoutDraft } from "../context/CheckoutDraftContext";
import {
  PAYMENT_METHODS,
  detectNetworkFromPhone,
  formatCameroonPhoneInput,
  validateCameroonPhone,
} from "../utils/cameroonPhone";
import { CARD_MAX_WIDTH } from "../utils/responsive";

// 12 top padding + the 54pt pill + 12 bottom padding, reserved by the scroll
// view so the last field can always clear the pinned Confirm bar.
const FOOTER_CLEARANCE = 78;

export default function SelectPaymentMethodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { paymentMethod, paymentPhone, selectPaymentMethod } =
    useCheckoutDraft();

  // Seeded from the context so reopening the screen shows the current choice
  // rather than an empty form.
  const [method, setMethod] = useState(paymentMethod);
  const [phone, setPhone] = useState(paymentPhone);
  const [phoneError, setPhoneError] = useState("");
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);

  React.useEffect(() => {
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

  const detectedNetwork = detectNetworkFromPhone(phone);
  const canConfirm = Boolean(method) && phone.trim().length > 0;

  const handleConfirm = () => {
    const validation = validateCameroonPhone(phone, method);
    if (!validation.isValid) {
      setPhoneError(validation.message);
      return;
    }

    selectPaymentMethod(method, phone);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <ScreenGradient style={styles.screen}>
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={24}
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: isKeyboardOpen
                ? 28
                : FOOTER_CLEARANCE + insets.bottom,
            },
          ]}
        >
          <View style={styles.contentWidth}>
            <Text style={styles.sectionLabel}>CHOOSE A WALLET</Text>

            {PAYMENT_METHODS.map((option) => {
              const isSelected = method === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.methodRow,
                    isSelected ? styles.methodRowActive : null,
                  ]}
                  onPress={() => {
                    setMethod(option.id);
                    // The number has to sit on the new wallet's network, so an
                    // error raised against the previous one is stale.
                    setPhoneError("");
                  }}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected ? styles.radioOuterActive : null,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text
                    style={[
                      styles.methodLabel,
                      isSelected ? styles.methodLabelActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}

            <Text style={styles.fieldLabel}>Mobile money number</Text>
            <TextInput
              value={phone}
              onChangeText={(value) => {
                setPhone(formatCameroonPhoneInput(value));
                if (phoneError) {
                  setPhoneError("");
                }
              }}
              placeholder="Phone number (e.g. +237 6XX XXX XXX)"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
            {detectedNetwork ? (
              <Text style={styles.networkHint}>
                Detected network: {detectedNetwork}
              </Text>
            ) : null}
            {phoneError ? (
              <Text style={styles.phoneError}>{phoneError}</Text>
            ) : null}

            <Text style={styles.fieldHint}>
              The payment request is sent to this number.
            </Text>
          </View>
        </KeyboardAwareScrollView>

        {isKeyboardOpen ? null : (
          <View style={[styles.ctaFooter, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={[styles.cta, canConfirm ? null : styles.ctaDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText} numberOfLines={1}>
                Confirm
              </Text>
            </Pressable>
          </View>
        )}
      </ScreenGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    screen: {
      flex: 1,
      marginTop: 0,
    },
    scrollArea: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 14,
      paddingTop: 18,
    },
    contentWidth: {
      width: "100%",
      maxWidth: CARD_MAX_WIDTH,
      alignSelf: "center",
    },
    sectionLabel: {
      fontFamily: "Poppins_700Bold",
      fontSize: 12,
      letterSpacing: 0.6,
      color: colors.textCartRestaurant,
      marginBottom: 10,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
      marginBottom: 10,
      minHeight: 56,
    },
    methodRowActive: {
      borderColor: "#ff5a1f",
      backgroundColor: "#fff7f3",
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    radioOuterActive: {
      borderColor: "#ff5a1f",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#ff5a1f",
    },
    methodLabel: {
      fontSize: 15,
      color: colors.textPaymentLabel,
      fontWeight: "700",
    },
    methodLabelActive: {
      fontFamily: "Poppins_800ExtraBold",
    },
    fieldLabel: {
      marginTop: 18,
      fontSize: 13,
      fontWeight: "700",
      color: colors.textHeading,
    },
    phoneInput: {
      marginTop: 8,
      backgroundColor: colors.bgPaymentOption,
      borderWidth: 1,
      borderColor: colors.borderPaymentOption,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textHeading,
    },
    networkHint: {
      marginTop: 6,
      fontSize: 12,
      color: colors.success,
      fontWeight: "700",
    },
    phoneError: {
      marginTop: 6,
      fontSize: 12,
      color: colors.dangerText,
      fontWeight: "700",
    },
    fieldHint: {
      marginTop: 10,
      fontSize: 12,
      color: colors.textMuted,
    },
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
    cta: {
      borderRadius: 999,
      backgroundColor: "#ff5a1f",
      minHeight: 54,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaDisabled: {
      opacity: 0.6,
    },
    ctaText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 17,
    },
  }),
};
