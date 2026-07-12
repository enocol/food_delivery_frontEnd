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
import sharedStyles from "../components/styles";

export default function RegisterScreen({ onGoToSignIn }) {
  const { authActionLoading, createAccountWithEmailPassword } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Password required", "Please enter your password.");
      return;
    }

    try {
      await createAccountWithEmailPassword(name.trim(), email.trim(), password);
    } catch (error) {
      Alert.alert("Account creation failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
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
                <Text style={styles.authTitle}>Create Account</Text>
                <Text style={styles.authSubtitle}>
                  Enter your name, email, and password to create a new account.
                </Text>

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
                  style={styles.authInput}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={styles.authInput}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  style={styles.authInput}
                />

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
                  onPress={onGoToSignIn}
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
