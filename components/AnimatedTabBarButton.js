import React from 'react';
import { Animated, Pressable, View } from 'react-native';
import styles from './styles';

export default function AnimatedTabBarButton({
  children,
  accessibilityState,
  onPress,
  onLongPress,
  style,
  testID,
}) {
  const focused = Boolean(accessibilityState?.selected);
  const progress = React.useRef(new Animated.Value(focused ? 1 : 0)).current;
  const spring = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: focused ? 1 : 0,
        duration: focused ? 240 : 180,
        useNativeDriver: true,
      }),
      Animated.spring(spring, {
        toValue: focused ? 1 : 0,
        damping: 16,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, progress, spring]);

  const animatedStyle = {
    transform: [
      {
        scale: spring.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
      {
        translateY: spring.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
    ],
  };

  return (
    <Pressable testID={testID} onPress={onPress} onLongPress={onLongPress} style={style}>
      <Animated.View style={[styles.tabButtonInner, animatedStyle]}>
        <Animated.View style={[styles.tabButtonActiveOverlay, { opacity: progress }]} />
        <View style={styles.tabButtonContent}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}
