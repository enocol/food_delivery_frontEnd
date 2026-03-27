import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { RESTAURANTS } from '../data/restaurants';
import useRootCartHeader from '../components/useRootCartHeader';
import styles from '../components/styles';
import { toImageSource } from '../utils/imageSource';

export default function SearchScreen({ navigation }) {
  const { cartCount, openCartSheet } = useCart();
  const [query, setQuery] = useState('');

  useRootCartHeader(navigation, cartCount, 'Search', openCartSheet);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredResults = RESTAURANTS.filter((restaurant) => {
    if (!normalizedQuery) {
      return true;
    }

    const matchesRestaurant = restaurant.name.toLowerCase().includes(normalizedQuery);
    const matchesCuisine = restaurant.cuisine.toLowerCase().includes(normalizedQuery);
    const matchesMenu = restaurant.menu.some(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery)
    );

    return matchesRestaurant || matchesCuisine || matchesMenu;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient colors={['#eef7ef', '#f8f8f2']} style={styles.gradientBackground}>
        <View style={styles.searchHeaderBlock}>
          <Text style={styles.sectionTitle}>Search restaurants and meals</Text>
          <Text style={styles.sectionSubtitle}>Find ndole, grilled fish, street food, and more.</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurant, cuisine, or dish"
            placeholderTextColor="#7f847d"
            style={styles.searchInput}
          />
        </View>

        <ScrollView contentContainerStyle={styles.searchResultsWrap}>
          {filteredResults.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              activeOpacity={0.88}
              style={styles.searchResultCard}
              onPress={() => navigation.getParent()?.navigate('RestaurantDetails', { restaurantId: restaurant.id })}
            >
              <Image source={toImageSource(restaurant.image)} style={styles.searchResultImage} />
              <View style={styles.searchResultContent}>
                <Text style={styles.searchResultTitle}>{restaurant.name}</Text>
                <Text style={styles.metaText}>{restaurant.cuisine}</Text>
                <Text style={styles.metaText}>{restaurant.menu.slice(0, 2).map((item) => item.name).join(' • ')}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {filteredResults.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Text style={styles.emptyTitle}>No matching results.</Text>
              <Text style={styles.emptySub}>Try another meal name or restaurant keyword.</Text>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
