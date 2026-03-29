import React from 'react';
import { Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { RESTAURANTS } from '../data/restaurants';
import { toImageSource } from '../utils/imageSource';
import { formatXaf } from '../utils/formatXaf';
import styles from '../components/styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RestaurantDetailsScreen({ route, navigation }) {
  const { addToCart } = useCart();
  const restaurant = RESTAURANTS.find((it) => it.id === route.params?.restaurantId);

  if (!restaurant) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.emptyTitle}>Restaurant not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.detailsTopControls}>
        <Pressable onPress={() => navigation.goBack()} style={styles.detailsBackButton}>
          <Ionicons name="chevron-back" size={30} color="#000000" />
        </Pressable>
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.detailsContainer}>
        <Image source={restaurant.image} style={styles.detailsHeroImage} />
        <Text style={styles.detailsTitle}>{restaurant.name}</Text>
        <Text style={styles.detailsMeta}>{restaurant.cuisine} • {restaurant.eta}</Text>

      {restaurant.menu.map((item) => (
        <View key={item.id} style={styles.menuCard}>
          <Image source={toImageSource(item.image)} style={styles.menuImage} />
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
            <Text style={styles.menuPrice}>{formatXaf(item.price)}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item, restaurant)}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
    </View>
  );
}
