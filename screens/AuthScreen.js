import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import styles from '../components/styles';

export default function AuthScreen() {
  const { authActionLoading, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUpMode, setSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    if (!password) {
      Alert.alert('Password required', 'Please enter your password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters for your password.');
      return;
    }

    if (isSignUpMode && password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirmation do not match.');
      return;
    }

    try {
      if (isSignUpMode) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error) {
      Alert.alert(isSignUpMode ? 'Sign-up failed' : 'Sign-in failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#fff8f0', '#f8efe8']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.authWrap}>
          <View style={styles.authHeroCard}>
            <Text style={styles.authTitle}>Welcome to Mbolo Eats</Text>
            <Text style={styles.authSubtitle}>Sign in with email and password to continue your orders.</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authSectionTitle}>{isSignUpMode ? 'Create account' : 'Sign in'}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.authInput}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.authInput}
            />
            {isSignUpMode ? (
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.authInput}
              />
            ) : null}

            <Pressable style={styles.authPrimaryButton} onPress={handleSubmit} disabled={authActionLoading}>
              {authActionLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.authPrimaryButtonText}>
                  {isSignUpMode ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.authSecondaryButton}
              onPress={() => {
                setSignUpMode((current) => !current);
                setConfirmPassword('');
              }}
              disabled={authActionLoading}
            >
              <Text style={styles.authSecondaryButtonText}>
                {isSignUpMode ? 'Already have an account? Sign in' : 'No account yet? Create one'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
