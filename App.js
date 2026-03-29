import React, { useMemo, useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import AnimatedTabBarButton from './components/AnimatedTabBarButton';
import CartBottomSheet from './components/CartBottomSheet';
import styles from './components/styles';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartContext } from './context/CartContext';
import AuthScreen from './screens/AuthScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import RestaurantDetailsScreen from './screens/RestaurantDetailsScreen';
import SearchScreen from './screens/SearchScreen';
import { normalizeImageForState } from './utils/imageSource';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#ff6600',
        tabBarInactiveTintColor: '#c4cbbe',
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

          return <Ionicons name={iconName} size={focused ? 30 : size ?? 30} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: '', tabBarLabel: '', headerShown: true }} />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ title: '', tabBarLabel: '', headerShown: true, headerTransparent: false, headerTitle: '' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: '', tabBarLabel: '', headerShown: true, headerTransparent: false, headerTitle: '' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, authLoading } = useAuth();

  const [cartItems, setCartItems] = useState({});
  const [isCartSheetOpen, setCartSheetOpen] = useState(false);

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  
  useEffect(() => {
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
          image: normalizeImageForState(item.image),
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

 

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Loading account...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <CartContext.Provider value={cartValue}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: styles.headerTitle,
            headerShown: false,
          }}
          
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="RestaurantDetails"
            component={RestaurantDetailsScreen}
            options={{ title: 'Restaurant', headerBackLabelVisible: false, headerTransparent: true }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={({ navigation }) => ({
              title: '',
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerBackTitle: '',
              headerBackLabelVisible: false,
              headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()} style={{ paddingHorizontal: 4 }}>
                  <Ionicons name="chevron-back" size={30} color="#000000" />
                </Pressable>
              ),
            })}
          />
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


