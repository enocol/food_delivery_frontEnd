import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { RESTAURANTS } from '../data/restaurants';
import useRootCartHeader from '../components/useRootCartHeader';
import styles from '../components/styles';

export default function HomeScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();

  useRootCartHeader(navigation, cartCount, 'Mbolo Eats', openCartSheet);

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#fff7ec', '#fef3e2', '#f8f1e7']} style={styles.gradientBackground}>
        <Text style={styles.heroTitle}>Order Food Across Cameroon</Text>
        <Text style={styles.heroSubtitle}>Pick a restaurant and get your meal delivered fast.</Text>

        <FlatList
          data={RESTAURANTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.restaurantList}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.restaurantCard}
              onPress={() => navigation.getParent()?.navigate('RestaurantDetails', { restaurantId: item.id })}
            >
              <Image source={{ uri: item.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantContent}>
                <View style={styles.rowBetween}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.rating}>{item.rating}</Text>
                </View>
                <Text style={styles.metaText}>{item.cuisine}</Text>
                <Text style={styles.metaText}>{item.eta}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </LinearGradient>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
