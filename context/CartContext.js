import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";
import { useAuth } from "./AuthContext";
import { playCartTickSound } from "../utils/cartFeedback";
import { normalizeImageForState } from "../utils/imageSource";
import {
  addItemToCart,
  clearCart as clearRemoteCart,
  ensureActiveCart,
  fetchActiveCart,
  removeCartItem,
  updateCartItemQty,
} from "../apis/cartApi";

export const CartContext = createContext(null);

function isLegacyUserIdConstraintError(error) {
  const message = String(error?.message || "");
  return (
    message.includes('null value in column "user_id" of relation "carts"') ||
    message.includes('null value in column "user_id" of relation "cart_items"')
  );
}

function mapCartSchemaError(error) {
  if (isLegacyUserIdConstraintError(error)) {
    return new Error(
      "Cart backend schema mismatch: user_id is required on carts/cart_items but backend writes firebase_uid only. Update backend inserts or drop legacy NOT NULL user_id constraints.",
    );
  }
  return error;
}

function isTransientCartLoadError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("econnreset") ||
    message.includes("network request failed") ||
    message.includes("fetch failed") ||
    message.includes("etimedout") ||
    message.includes("socket hang up")
  );
}

async function triggerAddToCartFeedback() {
  if (Platform.OS === "web") {
    return;
  }

  void playCartTickSound();

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    Vibration.vibrate(20);
  }
}

async function triggerIncreaseQtyFeedback() {
  if (Platform.OS === "web") {
    return;
  }

  void playCartTickSound();

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    Vibration.vibrate(12);
  }
}

async function triggerDecreaseQtyFeedback() {
  if (Platform.OS === "web") {
    return;
  }

  void playCartTickSound();

  try {
    await Haptics.selectionAsync();
  } catch {
    Vibration.vibrate(10);
  }
}

function toItemMap(cartPayload) {
  const items =
    cartPayload?.items ||
    cartPayload?.cart_items ||
    cartPayload?.cartItems ||
    [];

  return items.reduce((acc, row) => {
    const itemId = String(
      row.menuItemId || row.menu_item_id || row.itemId || row.id,
    );
    if (!itemId) {
      return acc;
    }

    const normalized = {
      id: itemId,
      name: row.name || row.menu_item_name || row.title || "Item",
      description: row.description || "",
      image: normalizeImageForState(row.image || row.imageUrl || row.image_url),
      price: Number(row.price || row.unitPrice || 0),
      qty: Number(row.qty || row.quantity || 0),
      restaurantId: row.restaurantId || row.restaurant_id || null,
      restaurantName: row.restaurantName || row.restaurant_name || "",
    };

    if (normalized.qty > 0) {
      acc[itemId] = normalized;
    }
    return acc;
  }, {});
}

// While signed out the cart lives entirely on the device. It is replayed into
// the server cart on sign-in (see mergeGuestCart) and discarded once accepted.
const GUEST_CART_KEY = "mboloeats.guestCart";

async function readGuestCart() {
  try {
    const stored = await AsyncStorage.getItem(GUEST_CART_KEY);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // A corrupt or unreadable cart should not block browsing.
    return {};
  }
}

async function writeGuestCart(items) {
  try {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Still usable for this session even if it will not survive a restart.
  }
}

// The same shape the server path falls back to when a response carries no
// items, extracted so the guest path cannot drift away from it.
function addItemLocally(current, item, restaurant, quantity) {
  const key = String(item.id);
  const existing = current[key];

  if (existing) {
    return {
      ...current,
      [key]: { ...existing, qty: existing.qty + quantity },
    };
  }

  return {
    ...current,
    [key]: {
      ...item,
      id: key,
      image: normalizeImageForState(item.image),
      qty: quantity,
      restaurantId: restaurant?.id,
      restaurantName: restaurant?.name,
    },
  };
}

function setQtyLocally(current, key, nextQty) {
  if (nextQty <= 0) {
    const updated = { ...current };
    delete updated[key];
    return updated;
  }
  return { ...current, [key]: { ...current[key], qty: nextQty } };
}

export function CartProvider({ children }) {
  const { user, firebaseUid, getAuthToken } = useAuth();
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState({});
  const [cartLoading, setCartLoading] = useState(false);
  const [isCartSheetOpen, setCartSheetOpen] = useState(false);

  const resetLocalCart = useCallback(() => {
    setCartId(null);
    setCartItems({});
  }, []);

  const isGuest = !user;

  // Replays a stored guest cart into the server cart one item at a time. Items
  // that land are dropped from storage and only failures are written back, so a
  // partial failure retries cleanly instead of double-adding on the next sign-in.
  const mergeGuestCart = useCallback(
    async (token) => {
      const pending = await readGuestCart();
      const entries = Object.values(pending);
      if (!entries.length) {
        return;
      }

      let activeCartId;
      try {
        const payload = await ensureActiveCart(token, firebaseUid);
        activeCartId =
          payload?.userId || payload?.cartId || payload?.id || firebaseUid;
      } catch (error) {
        // Leave storage untouched so the merge is retried on the next load.
        if (__DEV__) {
          console.warn(
            "[CartContext] guest cart merge deferred:",
            error.message,
          );
        }
        return;
      }

      const failed = {};
      for (const entry of entries) {
        try {
          await addItemToCart(
            token,
            activeCartId,
            {
              menuItemId: String(entry.id),
              quantity: Number(entry.qty) || 1,
              firebase_uid: firebaseUid,
            },
            firebaseUid,
          );
        } catch (error) {
          failed[String(entry.id)] = entry;
          if (__DEV__) {
            console.warn(
              `[CartContext] guest item ${entry.id} failed to merge:`,
              error.message,
            );
          }
        }
      }

      if (Object.keys(failed).length) {
        await writeGuestCart(failed);
        return;
      }

      try {
        await AsyncStorage.removeItem(GUEST_CART_KEY);
      } catch {
        // Worst case it merges again next sign-in; quantities would double, but
        // an unreadable storage layer is already the larger problem.
      }
    },
    [firebaseUid],
  );

  const loadCartFromServer = useCallback(async () => {
    if (!user) {
      // Signed out: the cart is whatever this device has stored.
      setCartLoading(true);
      try {
        setCartId(null);
        setCartItems(await readGuestCart());
      } finally {
        setCartLoading(false);
      }
      return;
    }

    setCartLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        resetLocalCart();
        return;
      }

      // Before reading the server cart, fold in anything added while signed out.
      await mergeGuestCart(token);

      const payload = await fetchActiveCart(token, firebaseUid);
      if (!payload) {
        resetLocalCart();
        return;
      }

      setCartId(
        payload.userId || payload.cartId || payload.id || firebaseUid || null,
      );
      setCartItems(toItemMap(payload));
    } catch (error) {
      if (isLegacyUserIdConstraintError(error)) {
        if (__DEV__) {
          console.warn(
            "[CartContext] Backend schema mismatch: user_id is NOT NULL on carts/cart_items, but backend uses firebase_uid-only inserts. Populate user_id server-side or drop legacy NOT NULL constraints.",
          );
        }
      } else if (isTransientCartLoadError(error)) {
        if (__DEV__) {
          console.warn(
            "[CartContext] Temporary network issue while loading cart. Keeping current cart state.",
          );
        }
        return;
      } else {
        if (__DEV__) {
          console.warn("[CartContext] Failed to load cart:", error.message);
        }
      }
      resetLocalCart();
    } finally {
      setCartLoading(false);
    }
  }, [firebaseUid, getAuthToken, mergeGuestCart, resetLocalCart, user]);

  useEffect(() => {
    loadCartFromServer();
  }, [loadCartFromServer]);

  // Persist the guest cart on every change so it survives an app restart.
  // Skipped while loading, otherwise the empty initial state would overwrite
  // the stored cart before the read that replaces it has landed.
  useEffect(() => {
    if (!isGuest || cartLoading) {
      return;
    }
    void writeGuestCart(cartItems);
  }, [cartItems, cartLoading, isGuest]);

  const ensureCart = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("You must be signed in to use cart.");
    }

    if (cartId) {
      return { token, activeCartId: cartId };
    }

    let payload;
    try {
      payload = await ensureActiveCart(token, firebaseUid);
    } catch (error) {
      if (isLegacyUserIdConstraintError(error)) {
        throw new Error(
          "Cart backend schema mismatch: carts.user_id is required but not being populated server-side.",
        );
      }
      throw error;
    }

    const activeCartId =
      payload?.userId || payload?.cartId || payload?.id || firebaseUid;
    if (!activeCartId) {
      throw new Error("Could not create a cart.");
    }

    setCartId(activeCartId);
    setCartItems(toItemMap(payload));
    return { token, activeCartId };
  }, [cartId, firebaseUid, getAuthToken]);

  const addToCart = useCallback(
    async (item, restaurant, quantity = 1) => {
      const nextQuantity = Math.max(1, Number(quantity) || 1);

      if (isGuest) {
        setCartItems((current) =>
          addItemLocally(current, item, restaurant, nextQuantity),
        );
        void triggerAddToCartFeedback();
        return;
      }

      const { token, activeCartId } = await ensureCart();

      let payload;
      try {
        payload = await addItemToCart(
          token,
          activeCartId,
          {
            menuItemId: String(item.id),
            quantity: nextQuantity,
            firebase_uid: firebaseUid,
          },
          firebaseUid,
        );
      } catch (error) {
        throw mapCartSchemaError(error);
      }

      if (payload?.items) {
        setCartItems(toItemMap(payload));
        void triggerAddToCartFeedback();
        return;
      }

      setCartItems((current) => {
        const key = String(item.id);
        const existing = current[key];
        if (existing) {
          return {
            ...current,
            [key]: { ...existing, qty: existing.qty + nextQuantity },
          };
        }

        return {
          ...current,
          [key]: {
            ...item,
            id: key,
            image: normalizeImageForState(item.image),
            qty: nextQuantity,
            restaurantId: restaurant?.id,
            restaurantName: restaurant?.name,
          },
        };
      });
      void triggerAddToCartFeedback();
    },
    [ensureCart, firebaseUid, isGuest],
  );

  const increaseQty = useCallback(
    async (itemId) => {
      const key = String(itemId);
      const existing = cartItems[key];
      if (!existing) {
        return;
      }

      const nextQty = existing.qty + 1;

      if (isGuest) {
        setCartItems((current) => setQtyLocally(current, key, nextQty));
        void triggerIncreaseQtyFeedback();
        return;
      }

      const { token, activeCartId } = await ensureCart();
      let payload;
      try {
        payload = await updateCartItemQty(
          token,
          activeCartId,
          key,
          nextQty,
          firebaseUid,
        );
      } catch (error) {
        throw mapCartSchemaError(error);
      }

      if (payload?.items) {
        setCartItems(toItemMap(payload));
        void triggerIncreaseQtyFeedback();
        return;
      }

      setCartItems((current) => ({
        ...current,
        [key]: { ...current[key], qty: nextQty },
      }));
      void triggerIncreaseQtyFeedback();
    },
    [cartItems, ensureCart, firebaseUid, isGuest],
  );

  const decreaseQty = useCallback(
    async (itemId) => {
      const key = String(itemId);
      const existing = cartItems[key];
      if (!existing) {
        return;
      }

      const nextQty = existing.qty - 1;

      if (isGuest) {
        setCartItems((current) => setQtyLocally(current, key, nextQty));
        void triggerDecreaseQtyFeedback();
        return;
      }

      const { token, activeCartId } = await ensureCart();

      if (nextQty <= 0) {
        let payload;
        try {
          payload = await removeCartItem(token, activeCartId, key, firebaseUid);
        } catch (error) {
          throw mapCartSchemaError(error);
        }

        if (payload?.items) {
          setCartItems(toItemMap(payload));
          void triggerDecreaseQtyFeedback();
          return;
        }

        setCartItems((current) => {
          const updated = { ...current };
          delete updated[key];
          return updated;
        });
        void triggerDecreaseQtyFeedback();
        return;
      }

      let payload;
      try {
        payload = await updateCartItemQty(
          token,
          activeCartId,
          key,
          nextQty,
          firebaseUid,
        );
      } catch (error) {
        throw mapCartSchemaError(error);
      }
      if (payload?.items) {
        setCartItems(toItemMap(payload));
        void triggerDecreaseQtyFeedback();
        return;
      }

      setCartItems((current) => ({
        ...current,
        [key]: { ...current[key], qty: nextQty },
      }));
      void triggerDecreaseQtyFeedback();
    },
    [cartItems, ensureCart, firebaseUid, isGuest],
  );

  const clearCart = useCallback(async () => {
    if (isGuest) {
      setCartItems({});
      setCartSheetOpen(false);
      return;
    }

    const token = await getAuthToken();
    if (token && cartId) {
      const payload = await clearRemoteCart(token, cartId, firebaseUid);
      if (payload?.items) {
        setCartItems(toItemMap(payload));
        setCartSheetOpen(false);
        return;
      }
    }
    setCartItems({});
    setCartSheetOpen(false);
  }, [cartId, firebaseUid, getAuthToken, isGuest]);

  const openCartSheet = useCallback(() => {
    setCartSheetOpen(true);
  }, []);

  const closeCartSheet = useCallback(() => {
    setCartSheetOpen(false);
  }, []);

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, item) => sum + item.qty, 0),
    [cartItems],
  );

  const cartTotal = useMemo(
    () =>
      Object.values(cartItems).reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
      ),
    [cartItems],
  );

  const value = useMemo(
    () => ({
      cartId,
      cartItems,
      cartCount,
      cartTotal,
      cartLoading,
      isCartSheetOpen,
      // Phase 3 (the checkout gate) and any "sign in to save your cart"
      // affordance both need to know this.
      isGuest,
      addToCart,
      increaseQty,
      decreaseQty,
      clearCart,
      openCartSheet,
      closeCartSheet,
      refreshCart: loadCartFromServer,
    }),
    [
      addToCart,
      cartCount,
      cartId,
      cartItems,
      cartLoading,
      cartTotal,
      clearCart,
      closeCartSheet,
      decreaseQty,
      isCartSheetOpen,
      isGuest,
      increaseQty,
      loadCartFromServer,
      openCartSheet,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
