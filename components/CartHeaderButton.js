import React from 'react';
import { Pressable, Text, View } from 'react-native';
import styles from './styles';

export default function CartHeaderButton({ count, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.cartHeaderButton}>
      <Text style={styles.cartHeaderIcon}>Cart</Text>
      {count > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
