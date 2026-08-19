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

export default function ForgotPasswordScreen({ onGoToSignIn, navigation }) {
  const router = useRouter();
  const { authActionLoading, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const isCompactScreen = useCompactScreen();
  const heroImageHeight = isCompactScreen ? 150 : 190;

  const handleGoToSignIn = () => {
    if (typeof onGoToSignIn === "function") {
      onGoToSignIn();
      return;
    }

    if (navigation?.navigate) {
      navigation.navigate("Auth");
      return;
    }

    router.navigate("/Auth");
  };

  const handleSendResetLink = async () => {
    setEmailError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    try {
      await resetPassword(normalizedEmail);
      setSubmittedEmail(normalizedEmail);
    } catch (error) {
      Alert.alert("Couldn't send reset link", error.message);
    }
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
                {submittedEmail ? (
                  <>
                    <Text style={styles.authTitle}>Check your email</Text>
                    <Text style={styles.authSubtitle}>
                      If an account exists for {submittedEmail}, we've sent a
                      link to reset your password.
                    </Text>

                    <Pressable
                      style={styles.authPrimaryButton}
                      onPress={handleGoToSignIn}
                    >
                      <Text style={styles.authPrimaryButtonText}>
                        Back to sign in
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.authTitle}>Reset password</Text>
                    <Text style={styles.authSubtitle}>
                      Enter your email and we'll send you a link to reset
                      your password.
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
                      <Text style={styles.authFieldErrorText}>
                        {emailError}
                      </Text>
                    ) : null}

                    <Pressable
                      style={styles.authPrimaryButton}
                      onPress={handleSendResetLink}
                      disabled={authActionLoading}
                    >
                      {authActionLoading ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.authPrimaryButtonText}>
                          Send reset link
                        </Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.authSecondaryButton}
                      onPress={handleGoToSignIn}
                      disabled={authActionLoading}
                    >
                      <Text style={styles.authSecondaryButtonText}>
                        Back to sign in
                      </Text>
                    </Pressable>
                  </>
                )}
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
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 28,
      color: colors.textHeadingWarm,
    },
    authSubtitle: {
      fontFamily: "PlusJakartaSans_400Regular",
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
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: colors.danger,
    },
    authPrimaryButton: {
      marginTop: 2,
      backgroundColor: "#ff5a1f",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    authPrimaryButtonText: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
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
    authSecondaryButtonText: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      color: colors.textDark,
      fontSize: 14,
    },
  }),
};
