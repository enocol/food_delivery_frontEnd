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
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { firebaseConfig } from "../utils/firebase";
import styles from "../components/styles";

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
            colors={["#fff8f0", "#f8efe8"]}
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
                    <ActivityIndicator color="#ffffff" />
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
