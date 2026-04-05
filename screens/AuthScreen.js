import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import styles from "../components/styles";

export default function AuthScreen() {
  const { authActionLoading, sendOtpCode, verifyAndSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    try {
      await sendOtpCode(email.trim());
      setCodeSent(true);
      Alert.alert(
        "Code sent",
        "Check your inbox for a 6-digit code and enter it below.",
      );
    } catch (error) {
      Alert.alert("Could not send code", error.message);
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    if (!otp.trim()) {
      Alert.alert(
        "Code required",
        "Please enter the 6-digit code from your email.",
      );
      return;
    }

    try {
      await verifyAndSignIn(email.trim(), otp.trim());
    } catch (error) {
      Alert.alert("Sign-in failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ flex: 1, paddingTop: 100 }}>
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
                Enter your email to receive a 6-digit sign-in code. EmailJS
                sends the code, and Firebase signs you in or creates your
                account the first time you verify it.
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.authInput}
              />

              {codeSent ? (
                <TextInput
                  value={otp}
                  onChangeText={(text) =>
                    setOtp(text.replace(/\D/g, "").slice(0, 6))
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
                      : "Send code to my email"}
                  </Text>
                )}
              </Pressable>

              {codeSent ? (
                <Pressable
                  style={styles.authSecondaryButton}
                  onPress={() => {
                    setCodeSent(false);
                    setOtp("");
                  }}
                  disabled={authActionLoading}
                >
                  <Text style={styles.authSecondaryButtonText}>
                    Use a different email
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
