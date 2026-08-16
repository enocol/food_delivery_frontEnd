import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
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
  useWindowDimensions,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as colors from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import sharedStyles from "../components/styles";
import { useRouter } from "expo-router";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^(?:[A-Za-z]+(?:[ -][A-Za-z]+)*)$/;

export default function RegisterScreen({ onGoToSignIn, navigation }) {
  const router = useRouter();
  const { authActionLoading, createAccountWithEmailPassword } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { height: windowHeight } = useWindowDimensions();
  const isCompactScreen = windowHeight < 750;
  const heroImageHeight = isCompactScreen ? 150 : 190;

  const handleCreateAccount = async () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedName) {
      setNameError("Please enter your name.");
      return;
    }

    if (normalizedName.length < 2 || normalizedName.length > 60) {
      setNameError("Name must be between 2 and 60 characters.");
      return;
    }

    if (!NAME_REGEX.test(normalizedName)) {
      setNameError(
        "Name can only contain letters, spaces, and hyphens. Numbers are not allowed.",
      );
      return;
    }

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
      await createAccountWithEmailPassword(
        normalizedName,
        normalizedEmail,
        normalizedPassword,
      );
    } catch (error) {
      Alert.alert("Account creation failed", error.message);
    }
  };

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
                <Text style={styles.authTitle}>Create Account</Text>
                <Text style={styles.authSubtitle}>
                  Enter your name, email, and password to create a new account.
                </Text>

                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (nameError) {
                      setNameError("");
                    }
                  }}
                  placeholder="Full name"
                  placeholderTextColor={colors.textDark}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
                  style={[
                    styles.authInput,
                    nameError ? styles.authInputError : null,
                  ]}
                />
                {nameError ? (
                  <Text style={styles.authFieldErrorText}>{nameError}</Text>
                ) : null}

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
                  textContentType="newPassword"
                  autoComplete="new-password"
                  style={[
                    styles.authInput,
                    passwordError ? styles.authInputError : null,
                  ]}
                />
                {passwordError ? (
                  <Text style={styles.authFieldErrorText}>{passwordError}</Text>
                ) : null}

                <Pressable
                  style={styles.authPrimaryButton}
                  onPress={handleCreateAccount}
                  disabled={authActionLoading}
                >
                  {authActionLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.authPrimaryButtonText}>
                      Create account
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.authSecondaryButton}
                  onPress={handleGoToSignIn}
                  disabled={authActionLoading}
                >
                  <Text style={styles.authSecondaryButtonText}>
                    Already have an account? Sign in
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
      color: colors.textDark,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 18,
      height: 60,
    },
    authInputError: {
      borderColor: colors.danger,
    },
    authFieldErrorText: {
      marginTop: -2,
      fontFamily: "Inter_400Regular",
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
