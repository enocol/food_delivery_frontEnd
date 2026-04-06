import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { normalizeImageForState } from "../utils/imageSource";
import {
  addItemToCart,
  clearCart as clearRemoteCart,
  ensureActiveCart,
  fetchActiveCart,
  removeCartItem,
  updateCartItemQty,
} from "../utils/cartApi";

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
      image: normalizeImageForState(row.image || row.image_url),
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

  const loadCartFromServer = useCallback(async () => {
    if (!user) {
      resetLocalCart();
      return;
    }

    setCartLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        resetLocalCart();
        return;
      }

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
        console.warn(
          "[CartContext] Backend schema mismatch: user_id is NOT NULL on carts/cart_items, but backend uses firebase_uid-only inserts. Populate user_id server-side or drop legacy NOT NULL constraints.",
        );
      } else if (isTransientCartLoadError(error)) {
        console.warn(
          "[CartContext] Temporary network issue while loading cart. Keeping current cart state.",
        );
        return;
      } else {
        console.warn("[CartContext] Failed to load cart:", error.message);
      }
      resetLocalCart();
    } finally {
      setCartLoading(false);
    }
  }, [firebaseUid, getAuthToken, resetLocalCart, user]);

  useEffect(() => {
    loadCartFromServer();
  }, [loadCartFromServer]);

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
    async (item, restaurant) => {
      const { token, activeCartId } = await ensureCart();

      let payload;
      try {
        payload = await addItemToCart(
          token,
          activeCartId,
          {
            menuItemId: String(item.id),
            quantity: 1,
            firebase_uid: firebaseUid,
          },
          firebaseUid,
        );
      } catch (error) {
        throw mapCartSchemaError(error);
      }

      if (payload?.items) {
        setCartItems(toItemMap(payload));
        setCartSheetOpen(true);
        return;
      }

      setCartItems((current) => {
        const key = String(item.id);
        const existing = current[key];
        if (existing) {
          return {
            ...current,
            [key]: { ...existing, qty: existing.qty + 1 },
          };
        }

        return {
          ...current,
          [key]: {
            ...item,
            id: key,
            image: normalizeImageForState(item.image),
            qty: 1,
            restaurantId: restaurant?.id,
            restaurantName: restaurant?.name,
          },
        };
      });
      setCartSheetOpen(true);
    },
    [ensureCart, firebaseUid],
  );

  const increaseQty = useCallback(
    async (itemId) => {
      const key = String(itemId);
      const existing = cartItems[key];
      if (!existing) {
        return;
      }

      const { token, activeCartId } = await ensureCart();
      const nextQty = existing.qty + 1;
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
        return;
      }

      setCartItems((current) => ({
        ...current,
        [key]: { ...current[key], qty: nextQty },
      }));
    },
    [cartItems, ensureCart, firebaseUid],
  );

  const decreaseQty = useCallback(
    async (itemId) => {
      const key = String(itemId);
      const existing = cartItems[key];
      if (!existing) {
        return;
      }

      const { token, activeCartId } = await ensureCart();
      const nextQty = existing.qty - 1;

      if (nextQty <= 0) {
        let payload;
        try {
          payload = await removeCartItem(token, activeCartId, key, firebaseUid);
        } catch (error) {
          throw mapCartSchemaError(error);
        }

        if (payload?.items) {
          setCartItems(toItemMap(payload));
          return;
        }

        setCartItems((current) => {
          const updated = { ...current };
          delete updated[key];
          return updated;
        });
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
        return;
      }

      setCartItems((current) => ({
        ...current,
        [key]: { ...current[key], qty: nextQty },
      }));
    },
    [cartItems, ensureCart, firebaseUid],
  );

  const clearCart = useCallback(async () => {
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
  }, [cartId, firebaseUid, getAuthToken]);

  const openCartSheet = useCallback(() => {
    if (Object.keys(cartItems).length > 0) {
      setCartSheetOpen(true);
    }
  }, [cartItems]);

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
