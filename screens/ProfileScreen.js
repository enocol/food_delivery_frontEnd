import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { formatXaf } from '../utils/formatXaf';
import useRootCartHeader from '../components/useRootCartHeader';
import styles from '../components/styles';

export default function ProfileScreen({ navigation }) {
  const { cartCount, cartTotal, openCartSheet } = useCart();

  useRootCartHeader(navigation, cartCount, 'Profile', openCartSheet);

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#fff8f0', '#f8efe8']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.profileWrap}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>RM</Text>
            </View>
            <Text style={styles.profileName}>Ryzen Member</Text>
            <Text style={styles.profileMeta}>Douala, Cameroon</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Account summary</Text>
            <Text style={styles.infoLine}>Open cart items: {cartCount}</Text>
            <Text style={styles.infoLine}>Current cart total: {formatXaf(cartTotal)}</Text>
            <Text style={styles.infoLine}>Preferred delivery area: Bonamoussadi</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Quick actions</Text>
            <Text style={styles.infoLine}>Saved addresses</Text>
            <Text style={styles.infoLine}>Payment methods</Text>
            <Text style={styles.infoLine}>Order history</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
