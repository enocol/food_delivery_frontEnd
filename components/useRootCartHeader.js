import React from 'react';
import CartHeaderButton from './CartHeaderButton';

export default function useRootCartHeader(navigation, cartCount, title, onCartPress) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => <CartHeaderButton count={cartCount} onPress={onCartPress} />,
    });
  }, [navigation, cartCount, title, onCartPress]);
}
