import React, { useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as colors from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { firebaseConfig } from "../utils/firebase";
import sharedStyles from "../components/styles";

export default function AuthScreen() {
  const { authActionLoading, sendPhoneCode, verifyPhoneCode } = useAuth();
  const recaptchaVerifierRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }

    try {
      await sendPhoneCode(phoneNumber.trim(), recaptchaVerifierRef.current);
      setCodeSent(true);
      Alert.alert(
        "Code sent",
        "Check your SMS inbox for a 6-digit verification code.",
      );
    } catch (error) {
      Alert.alert("Could not send code", error.message);
    }
  };

  const handleVerifyCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }

    if (!verificationCode.trim()) {
      Alert.alert(
        "Code required",
        "Please enter the 6-digit verification code from SMS.",
      );
      return;
    }

    try {
      await verifyPhoneCode(verificationCode.trim());
    } catch (error) {
      Alert.alert("Sign-in failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifierRef}
        firebaseConfig={firebaseConfig}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: 40, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../assets/splash-icon.png")}
            style={{ width: "100%", height: 120 }}
          />
          <LinearGradient
            colors={colors.gradients.warmCream}
            style={styles.gradientBackground}
          >
            <View style={styles.authWrap}>
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Sign In</Text>
                <Text style={styles.authSubtitle}>
                  Enter your phone number to receive a 6-digit SMS code.
                  Firebase signs you in after phone verification and creates the
                  account automatically for new users.
                </Text>

                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone number (e.g. +2376XXXXXXXX)"
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  style={styles.authInput}
                />

                {codeSent ? (
                  <TextInput
                    value={verificationCode}
                    onChangeText={(text) =>
                      setVerificationCode(text.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCorrect={false}
                    style={styles.authInput}
                  />
                ) : null}

                <Pressable
                  style={styles.authPrimaryButton}
                  onPress={codeSent ? handleVerifyCode : handleSendCode}
                  disabled={authActionLoading}
                >
                  {authActionLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.authPrimaryButtonText}>
                      {codeSent
                        ? "Verify code and sign in"
                        : "Send code to my phone"}
                    </Text>
                  )}
                </Pressable>

                {codeSent ? (
                  <Pressable
                    style={styles.authSecondaryButton}
                    onPress={() => {
                      setCodeSent(false);
                      setVerificationCode("");
                    }}
                    disabled={authActionLoading}
                  >
                    <Text style={styles.authSecondaryButtonText}>
                      Use a different phone number
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    authWrap: {
      paddingTop: 30,
      gap: 14,
      flex: 1,
      paddingHorizontal: 16,
    },
    authTitle: {
      fontFamily: "Nunito_900Black",
      fontSize: 28,
      fontWeight: "900",
      color: colors.textHeadingWarm,
    },
    authSubtitle: {
      fontFamily: "Inter_400Regular",
      marginTop: 6,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    authCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    authInput: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.borderInput,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 18,
      height: 60,
    },
    authPrimaryButton: {
      marginTop: 2,
      backgroundColor: colors.authButton,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    authPrimaryButtonText: {
      fontFamily: "Nunito_800ExtraBold",
      color: colors.white,
      fontSize: 18,
      fontWeight: "800",
    },
    authSecondaryButton: {
      borderWidth: 1,
      borderColor: colors.borderPicker,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.white,
    },
    authSecondaryButtonDisabled: {
      opacity: 0.55,
    },
    authSecondaryButtonText: {
      fontFamily: "Nunito_800ExtraBold",
      color: colors.textDark,
      fontSize: 14,
      fontWeight: "800",
    },
  }),
};
