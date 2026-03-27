import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from '../components/styles';
import { useCart } from '../context/CartContext';
import { formatXaf } from '../utils/formatXaf';

const PAYMENT_METHODS = [
  { id: 'mtn-momo', label: 'MTN MoMo' },
  { id: 'orange-money', label: 'Orange Money' },
  { id: 'cash-on-delivery', label: 'Cash on Delivery' },
];

export default function CheckoutScreen({ navigation }) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mtn-momo');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const itemCount = Object.values(cartItems).reduce((sum, item) => sum + item.qty, 0);

  const formatCameroonPhoneInput = (rawValue) => {
    const digits = rawValue.replace(/\D/g, '');
    const hasCountryCode = digits.startsWith('237');
    const local = hasCountryCode ? digits.slice(3, 12) : digits.slice(0, 9);

    if (!local) {
      return hasCountryCode ? '+237 ' : '';
    }

    const p1 = local.slice(0, 3);
    const p2 = local.slice(3, 6);
    const p3 = local.slice(6, 9);
    const grouped = [p1, p2, p3].filter(Boolean).join(' ');

    return hasCountryCode ? `+237 ${grouped}` : grouped;
  };

  const validateCameroonPhone = (rawPhone, paymentMethod) => {
    const digits = rawPhone.replace(/\D/g, '');
    const local = digits.startsWith('237') ? digits.slice(3) : digits;
    const isValid = /^6\d{8}$/.test(local);

    if (!isValid) {
      return {
        isValid: false,
        message: 'Enter a valid Cameroon number (e.g. 6XXXXXXXX or +2376XXXXXXXX).',
      };
    }

    if (paymentMethod === 'mtn-momo' && !/^6[5-8]/.test(local)) {
      return {
        isValid: false,
        message: 'MTN MoMo requires an MTN line (typically starting with 65, 66, 67, or 68).',
      };
    }

    if (paymentMethod === 'orange-money' && !/^69/.test(local)) {
      return {
        isValid: false,
        message: 'Orange Money requires an Orange line (typically starting with 69).',
      };
    }

    return { isValid: true };
  };

  const detectNetworkFromPhone = (rawPhone) => {
    const digits = rawPhone.replace(/\D/g, '');
    const local = digits.startsWith('237') ? digits.slice(3) : digits;

    if (!/^6\d{8}$/.test(local)) {
      return null;
    }

    if (/^69/.test(local)) {
      return 'Orange';
    }

    if (/^6[5-8]/.test(local)) {
      return 'MTN';
    }

    return 'Unknown';
  };

  const placeOrder = () => {
    if (itemCount === 0) {
      Alert.alert('Cart empty', 'Add at least one item before placing your order.');
      navigation.goBack();
      return;
    }

    if (selectedPaymentMethod !== 'cash-on-delivery') {
      const validation = validateCameroonPhone(mobileMoneyPhone, selectedPaymentMethod);
      if (!validation.isValid) {
        setPhoneError(validation.message);
        return;
      }
    }

    setPhoneError('');
    clearCart();
    Alert.alert('Order placed', 'Your order has been confirmed successfully.');
    navigation.navigate('MainTabs');
  };

  return (
    <LinearGradient colors={['#f2f7f2', '#fffdf7']} style={styles.checkoutscreen}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        contentContainerStyle={styles.checkoutScreenContent}
      >
        <View style={styles.paymentPickerCard}>
          <Text style={styles.paymentPickerTitle}>Order summary</Text>
          <Text style={styles.checkoutMetaText}>Items: {itemCount}</Text>
          <Text style={styles.checkoutMetaText}>Total to pay: {formatXaf(cartTotal)}</Text>
        </View>

        <View style={styles.paymentPickerCard}>
          <Text style={styles.paymentPickerTitle}>Choose payment method</Text>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedPaymentMethod === method.id;
            return (
              <Pressable
                key={method.id}
                style={styles.paymentOptionRow}
                onPress={() => {
                  setSelectedPaymentMethod(method.id);
                  if (method.id === 'cash-on-delivery') {
                    setPhoneError('');
                  }
                }}
              >
                <View style={[styles.paymentRadioOuter, isSelected ? styles.paymentRadioOuterActive : null]}>
                  {isSelected ? <View style={styles.paymentRadioInner} /> : null}
                </View>
                <Text style={styles.paymentOptionLabel}>{method.label}</Text>
              </Pressable>
            );
          })}

          {selectedPaymentMethod !== 'cash-on-delivery' ? (
            <>
              <TextInput
                value={mobileMoneyPhone}
                onChangeText={(value) => {
                  setMobileMoneyPhone(formatCameroonPhoneInput(value));
                  if (phoneError) {
                    setPhoneError('');
                  }
                }}
                placeholder="Phone number (e.g. +237 6XX XXX XXX)"
                placeholderTextColor="#7f847d"
                keyboardType="phone-pad"
                style={styles.paymentPhoneInput}
              />
              {detectNetworkFromPhone(mobileMoneyPhone) ? (
                <Text style={styles.paymentNetworkHint}>Detected network: {detectNetworkFromPhone(mobileMoneyPhone)}</Text>
              ) : null}
              {phoneError ? <Text style={styles.paymentPhoneError}>{phoneError}</Text> : null}
            </>
          ) : null}
        </View>

        <Pressable style={styles.checkoutScreenCta} onPress={placeOrder}>
          <Text style={styles.checkoutScreenCtaText}>Place Order</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
