import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { useCompactScreen } from "../utils/responsive";
import sharedStyles from "../components/styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({
  onGoToCreateAccount: onGoToCreateAccountProp,
  navigation,
}) {
  const router = useRouter();
  const { authActionLoading, signInWithEmailPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const isCompactScreen = useCompactScreen();
  const heroImageHeight = isCompactScreen ? 150 : 190;

  // Sign in unlocks only once the email looks valid and a password has been
  // typed. The full rule checks still run in handleSignIn on press.
  const canSubmit =
    EMAIL_REGEX.test(email.trim().toLowerCase()) &&
    password.trim().length > 0;
  const isSignInDisabled = authActionLoading || !canSubmit;

  const handleSignIn = async () => {
    setEmailError("");
    setPasswordError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    if (!normalizedPassword) {
      setPasswordError("Please enter your password.");
      return;
    }

    if (normalizedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (normalizedPassword.length > 72) {
      setPasswordError("Password must not exceed 72 characters.");
      return;
    }

    if (/\s/.test(normalizedPassword)) {
      setPasswordError("Password cannot contain spaces.");
      return;
    }

    try {
      await signInWithEmailPassword(normalizedEmail, normalizedPassword);
    } catch (error) {
      Alert.alert("Sign-in failed", error.message);
    }
  };

  const handleGoToCreateAccount = () => {
    if (typeof onGoToCreateAccountProp === "function") {
      onGoToCreateAccountProp();
      return;
    }

    if (navigation?.navigate) {
      navigation.navigate("Register");
      return;
    }

    router.navigate("/Register");
  };

  const handleGoToForgotPassword = () => {
    if (navigation?.navigate) {
      navigation.navigate("ForgotPassword");
      return;
    }

    router.navigate("/ForgotPassword");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.authScrollContent,
            isCompactScreen ? styles.authScrollContentCompact : null,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../assets/splash-icon.png")}
            resizeMode="contain"
            style={[styles.authHeroImage, { height: heroImageHeight }]}
          />
          <LinearGradient
            colors={colors.gradients.warmCream}
            style={[
              styles.authGradientBackground,
              isCompactScreen ? styles.authGradientBackgroundCompact : null,
            ]}
          >
            <View
              style={[
                styles.authWrap,
                isCompactScreen ? styles.authWrapCompact : null,
              ]}
            >
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Sign In</Text>
                <Text style={styles.authSubtitle}>
                  Enter your email and password to sign in.
                </Text>

                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) {
                      setEmailError("");
                    }
                  }}
                  placeholder="Email address"
                  placeholderTextColor={colors.textDark}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={[
                    styles.authInput,
                    emailError ? styles.authInputError : null,
                  ]}
                />
                {emailError ? (
                  <Text style={styles.authFieldErrorText}>{emailError}</Text>
                ) : null}

                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                  placeholder="Password"
                  placeholderTextColor={colors.textDark}
                  secureTextEntry
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  style={[
                    styles.authInput,
                    passwordError ? styles.authInputError : null,
                  ]}
                />
                {passwordError ? (
                  <Text style={styles.authFieldErrorText}>{passwordError}</Text>
                ) : null}

                <Pressable
                  style={styles.authForgotPasswordLink}
                  onPress={handleGoToForgotPassword}
                  disabled={authActionLoading}
                >
                  <Text style={styles.authForgotPasswordLinkText}>
                    Forgot password?
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.authPrimaryButton,
                    isSignInDisabled ? styles.authPrimaryButtonDisabled : null,
                  ]}
                  onPress={handleSignIn}
                  disabled={isSignInDisabled}
                >
                  {authActionLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.authPrimaryButtonText}>
                      Sign in now
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.authSecondaryButton}
                  onPress={handleGoToCreateAccount}
                  disabled={authActionLoading}
                >
                  <Text style={styles.authSecondaryButtonText}>
                    Create new account
                  </Text>
                </Pressable>
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
    authScrollContent: {
      paddingTop: 16,
      flexGrow: 1,
      paddingBottom: 16,
    },
    authScrollContentCompact: {
      paddingTop: 8,
    },
    authHeroImage: {
      width: "100%",
      alignSelf: "center",
      marginTop: 4,
      marginBottom: 10,
      zIndex: 0,
    },
    authGradientBackground: {
      flex: 1,
      marginTop: 0,
      paddingTop: 8,
    },
    authGradientBackgroundCompact: {
      paddingTop: 4,
    },
    authWrap: {
      paddingTop: 22,
      gap: 14,
      flex: 1,
      paddingHorizontal: 16,
    },
    authWrapCompact: {
      paddingTop: 12,
    },
    authTitle: {
      fontFamily: "Poppins_800ExtraBold",
      fontSize: 28,
      color: colors.textHeadingWarm,
    },
    authSubtitle: {
      fontFamily: "Poppins_400Regular",
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
      color: colors.textDark,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 18,
      minHeight: 60,
    },
    authInputError: {
      borderColor: colors.danger,
    },
    authFieldErrorText: {
      marginTop: -2,
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: colors.danger,
    },
    authForgotPasswordLink: {
      alignSelf: "flex-end",
    },
    authForgotPasswordLinkText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: colors.primary,
    },
    authPrimaryButton: {
      marginTop: 2,
      backgroundColor: "#ff5a1f",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    authPrimaryButtonDisabled: {
      opacity: 0.5,
    },
    authPrimaryButtonText: {
      fontFamily: "Poppins_800ExtraBold",
      color: colors.white,
      fontSize: 18,
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
      fontFamily: "Poppins_800ExtraBold",
      color: colors.textDark,
      fontSize: 14,
    },
  }),
};
