import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import AnimatedTabBarButton from './components/AnimatedTabBarButton';
import CartBottomSheet from './components/CartBottomSheet';
import styles from './components/styles';
import { CartContext } from './context/CartContext';
import CheckoutScreen from './screens/CheckoutScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import RestaurantDetailsScreen from './screens/RestaurantDetailsScreen';
import SearchScreen from './screens/SearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6f675e',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: '#fffdf7' },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName = 'home-outline';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={focused ? 24 : size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: 'Search', tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [cartItems, setCartItems] = useState({});
  const [isCartSheetOpen, setCartSheetOpen] = useState(false);

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  React.useEffect(() => {
    if (cartCount === 0) {
      setCartSheetOpen(false);
    }
  }, [cartCount]);

  const cartTotal = useMemo(
    () => Object.values(cartItems).reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const openCartSheet = () => {
    if (cartCount > 0) {
      setCartSheetOpen(true);
    }
  };

  const closeCartSheet = () => setCartSheetOpen(false);

  const openCheckoutScreen = () => {
    setCartSheetOpen(false);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Checkout');
    }
  };

  const addToCart = (item, restaurant) => {
    setCartItems((current) => {
      const existing = current[item.id];
      if (existing) {
        return {
          ...current,
          [item.id]: { ...existing, qty: existing.qty + 1 },
        };
      }

      return {
        ...current,
        [item.id]: {
          ...item,
          qty: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      };
    });
    setCartSheetOpen(true);
  };

  const increaseQty = (itemId) => {
    setCartItems((current) => {
      const existing = current[itemId];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [itemId]: { ...existing, qty: existing.qty + 1 },
      };
    });
  };

  const decreaseQty = (itemId) => {
    setCartItems((current) => {
      const existing = current[itemId];
      if (!existing) {
        return current;
      }

      if (existing.qty <= 1) {
        const updated = { ...current };
        delete updated[itemId];
        return updated;
      }

      return {
        ...current,
        [itemId]: { ...existing, qty: existing.qty - 1 },
      };
    });
  };

  const clearCart = () => {
    setCartItems({});
    setCartSheetOpen(false);
  };

  const cartValue = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    increaseQty,
    decreaseQty,
    clearCart,
    openCartSheet,
    closeCartSheet,
  };

  return (
    <CartContext.Provider value={cartValue}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerTintColor: '#1f2937',
            headerShadowVisible: false,
            headerTitleStyle: styles.headerTitle,
            contentStyle: { backgroundColor: '#fffdf7' },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={{ title: 'Restaurant' }}
          />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        </Stack.Navigator>
      </NavigationContainer>

      <CartBottomSheet
        visible={isCartSheetOpen && cartCount > 0}
        onClose={closeCartSheet}
        onCheckout={openCheckoutScreen}
      />
    </CartContext.Provider>
  );
}
