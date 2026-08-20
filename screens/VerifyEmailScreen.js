import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { consumePostAuthRedirect } from "../utils/postAuthRedirect";
import sharedStyles from "../components/styles";
import * as colors from "../utils/colors";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const {
    userEmail,
    emailVerified,
    refreshVerification,
    resendVerificationEmail,
    signOutUser,
  } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");

  // The one place that leaves this screen, so it covers both routes in: the
  // button below, and the foreground re-check that fires when the user comes
  // back from their mail app having tapped the link.
  useEffect(() => {
    if (!emailVerified) {
      return;
    }

    const queued = consumePostAuthRedirect();
    if (queued) {
      router.replace(queued);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/MainTabs/HomeTab");
    }
  }, [emailVerified, router]);

  const handleCheck = async () => {
    if (checking) {
      return;
    }

    setChecking(true);
    setNotice("");
    try {
      // Navigation is handled by the effect above when this flips the flag.
      const verified = await refreshVerification();
      if (!verified) {
        setNotice(
          "Not verified yet. Open the link in your inbox, then tap this again.",
        );
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resending) {
      return;
    }

    setResending(true);
    setNotice("");
    try {
      await resendVerificationEmail();
      setNotice("Sent. Check your inbox, and your spam folder.");
    } catch (error) {
      Alert.alert("Could not resend", error.message);
    } finally {
      setResending(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    try {
      await signOutUser();
    } catch (error) {
      Alert.alert("Sign out failed", error.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={colors.gradients.warmCream} style={styles.body}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={34} color={colors.primary} />
          </View>

          <Text style={styles.title}>Verify your email</Text>

          <Text style={styles.message}>
            We sent a verification link to{" "}
            <Text style={styles.email}>{userEmail || "your email address"}</Text>
            . Open it, then come back and confirm below.
          </Text>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable
            style={[styles.primaryButton, checking && styles.buttonDisabled]}
            onPress={handleCheck}
            disabled={checking}
          >
            <Text style={styles.primaryButtonText}>
              {checking ? "Checking..." : "I've verified my email"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, resending && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={styles.secondaryButtonText}>
              {resending ? "Sending..." : "Resend email"}
            </Text>
          </Pressable>

          <Pressable onPress={handleUseAnotherAccount} hitSlop={8}>
            <Text style={styles.linkText}>Use a different account</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  ...sharedStyles,
  ...StyleSheet.create({
    body: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderMid,
      paddingHorizontal: 22,
      paddingVertical: 28,
      alignItems: "center",
      gap: 14,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.successTint,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: "PlusJakartaSans_800ExtraBold",
      fontSize: 22,
      color: colors.textHeading,
      textAlign: "center",
    },
    message: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMid,
      textAlign: "center",
    },
    email: {
      fontFamily: "PlusJakartaSans_700Bold",
      color: colors.textHeading,
    },
    notice: {
      fontFamily: "PlusJakartaSans_500Medium",
      fontSize: 14,
      lineHeight: 20,
      color: colors.primaryDeep,
      textAlign: "center",
    },
    primaryButton: {
      width: "100%",
      backgroundColor: colors.authButton,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 4,
    },
    primaryButtonText: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 16,
      color: colors.textOnPrimary,
    },
    secondaryButton: {
      width: "100%",
      backgroundColor: colors.bgCream,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: "center",
    },
    secondaryButtonText: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 16,
      color: colors.primaryDeep,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    linkText: {
      fontFamily: "PlusJakartaSans_500Medium",
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
    },
  }),
};
