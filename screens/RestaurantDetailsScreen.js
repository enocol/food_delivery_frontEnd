import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';
import CartHeaderButton from '../components/CartHeaderButton';
import { RESTAURANTS } from '../data/restaurants';
import { formatXaf } from '../utils/formatXaf';
import styles from '../components/styles';

export default function RestaurantDetailsScreen({ route, navigation }) {
  const { cartCount, addToCart, openCartSheet } = useCart();
  const restaurant = RESTAURANTS.find((it) => it.id === route.params?.restaurantId);

  React.useLayoutEffect(() => {
    if (!restaurant) {
      return;
    }
    navigation.setOptions({
      title: restaurant.name,
      headerRight: () => <CartHeaderButton count={cartCount} onPress={openCartSheet} />,
    });
  }, [navigation, restaurant, cartCount, openCartSheet]);

  if (!restaurant) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.emptyTitle}>Restaurant not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.detailsContainer}>
      <Image source={{ uri: restaurant.image }} style={styles.detailsHeroImage} />
      <Text style={styles.detailsTitle}>{restaurant.name}</Text>
      <Text style={styles.detailsMeta}>{restaurant.cuisine} • {restaurant.eta}</Text>

      {restaurant.menu.map((item) => (
        <View key={item.id} style={styles.menuCard}>
          <Image source={{ uri: item.image }} style={styles.menuImage} />
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
  );
}
