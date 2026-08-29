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
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as colors from "../utils/colors";
import { useAuth } from "../context/AuthContext";
import { useCompactScreen } from "../utils/responsive";
import sharedStyles from "../components/styles";
import { useRouter } from "expo-router";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^(?:[A-Za-z]+(?:[ -][A-Za-z]+)*)$/;
const PASSWORD_MISMATCH_MESSAGE = "Passwords do not match.";

// Each returns "" when the value is valid, or the message to show under the
// field. Shared by the live "is the form submittable" check and the on-submit
// pass, so the rules can never drift apart.
function getNameError(value) {
  const name = value.trim();
  if (!name) {
    return "Please enter your name.";
  }
  if (name.length < 2 || name.length > 60) {
    return "Name must be between 2 and 60 characters.";
  }
  if (!NAME_REGEX.test(name)) {
    return "Name can only contain letters, spaces, and hyphens. Numbers are not allowed.";
  }
  return "";
}

function getEmailError(value) {
  const email = value.trim().toLowerCase();
  if (!email) {
    return "Please enter your email address.";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Enter a valid email address.";
  }
  return "";
}

function getPasswordError(value) {
  const password = value.trim();
  if (!password) {
    return "Please enter your password.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (password.length > 72) {
    return "Password must not exceed 72 characters.";
  }
  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }
  return "";
}

function getConfirmPasswordError(passwordValue, confirmValue) {
  const confirmPassword = confirmValue.trim();
  if (!confirmPassword) {
    return "Please confirm your password.";
  }
  if (passwordValue.trim() !== confirmPassword) {
    return PASSWORD_MISMATCH_MESSAGE;
  }
  return "";
}

export default function RegisterScreen({ onGoToSignIn, navigation }) {
  const router = useRouter();
  const { authActionLoading, createAccountWithEmailPassword } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Errors surface once a field has been left (or once Create account is
  // pressed), never while it is still being typed into for the first time.
  const [touched, setTouched] = useState({});
  const isCompactScreen = useCompactScreen();
  const heroImageHeight = isCompactScreen ? 150 : 190;

  const nameError = getNameError(name);
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);
  const isFormValid =
    !nameError && !emailError && !passwordError && !confirmPasswordError;

  const markTouched = (field) => {
    setTouched((previous) =>
      previous[field] ? previous : { ...previous, [field]: true },
    );
  };

  const visibleError = (field, error) =>
    touched[field] && error ? error : "";

  const visibleNameError = visibleError("name", nameError);
  const visibleEmailError = visibleError("email", emailError);
  const visiblePasswordError = visibleError("password", passwordError);
  const visibleConfirmPasswordError = visibleError(
    "confirmPassword",
    confirmPasswordError,
  );

  // A mismatch is about both password fields, so outline both of them.
  const passwordFieldHasError =
    Boolean(visiblePasswordError) ||
    visibleConfirmPasswordError === PASSWORD_MISMATCH_MESSAGE;

  const isCreateAccountDisabled = authActionLoading || !isFormValid;

  const handleCreateAccount = async () => {
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      return;
    }

    try {
      await createAccountWithEmailPassword(
        name.trim(),
        email.trim().toLowerCase(),
        password.trim(),
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
                  Enter your name, email, and password, then confirm your
                  password to create a new account.
                </Text>

                <TextInput
                  value={name}
                  onChangeText={setName}
                  onBlur={() => markTouched("name")}
                  placeholder="Full name"
                  placeholderTextColor={colors.textDark}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
                  style={[
                    styles.authInput,
                    visibleNameError ? styles.authInputError : null,
                  ]}
                />
                {visibleNameError ? (
                  <Text style={styles.authFieldErrorText}>
                    {visibleNameError}
                  </Text>
                ) : null}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => markTouched("email")}
                  placeholder="Email address"
                  placeholderTextColor={colors.textDark}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={[
                    styles.authInput,
                    visibleEmailError ? styles.authInputError : null,
                  ]}
                />
                {visibleEmailError ? (
                  <Text style={styles.authFieldErrorText}>
                    {visibleEmailError}
                  </Text>
                ) : null}

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => markTouched("password")}
                  placeholder="Password"
                  placeholderTextColor={colors.textDark}
                  secureTextEntry
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  style={[
                    styles.authInput,
                    passwordFieldHasError ? styles.authInputError : null,
                  ]}
                />
                {visiblePasswordError ? (
                  <Text style={styles.authFieldErrorText}>
                    {visiblePasswordError}
                  </Text>
                ) : null}

                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => markTouched("confirmPassword")}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textDark}
                  secureTextEntry
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  style={[
                    styles.authInput,
                    passwordFieldHasError ? styles.authInputError : null,
                  ]}
                />
                {visibleConfirmPasswordError ? (
                  <Text style={styles.authFieldErrorText}>
                    {visibleConfirmPasswordError}
                  </Text>
                ) : null}

                <Pressable
                  style={[
                    styles.authPrimaryButton,
                    isCreateAccountDisabled
                      ? styles.authPrimaryButtonDisabled
                      : null,
                  ]}
                  onPress={handleCreateAccount}
                  disabled={isCreateAccountDisabled}
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
