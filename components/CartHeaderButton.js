import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import styles from './styles';

export default function CartHeaderButton({ count, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.cartHeaderButton}>
      <Ionicons name="basket-outline" size={24} color="#bd3f1b" style={styles.cartHeaderIcon} />
      {count > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
