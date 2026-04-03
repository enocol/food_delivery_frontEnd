import React from 'react';
import CartHeaderButton from './CartHeaderButton';
import { View, Image, Text, Platform } from 'react-native';

export default function useRootCartHeader(
  navigation,
  cartCount,
  titleOrOnCartPress,
  maybeOnCartPress,
  config
) {
  const hasTitleArg = typeof titleOrOnCartPress === 'string';
  const title = hasTitleArg ? titleOrOnCartPress : undefined;
  const onCartPress = hasTitleArg ? maybeOnCartPress : titleOrOnCartPress;
  const headerHeight = config?.headerHeight;
  const headerBackgroundColor = config?.headerBackgroundColor;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      ...(title !== undefined ? { title } : null),
      ...(headerHeight ? { headerStyle: { height: headerHeight, backgroundColor: headerBackgroundColor } } : null),
      headerRight: () => <CartHeaderButton count={cartCount} onPress={onCartPress} />,
     // Placeholder to keep title centered when cart button is shown
    });
  }, [navigation, cartCount, onCartPress, title, headerHeight, headerBackgroundColor]);
}
