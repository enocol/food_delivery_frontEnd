import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// What the customer has filled in towards an order but not yet placed: the
// wallet they chose (on its own screen) and any note for the rider (from the
// sheet). Both are displayed and used on checkout, and both survive an app or
// phone restart so a half-finished checkout is not lost - they are cleared
// only once an order actually goes through.
const CheckoutDraftContext = createContext(null);

const DRAFT_KEY = "mboloeats.checkoutDraft";

async function readDraft() {
  try {
    const stored = await AsyncStorage.getItem(DRAFT_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    // A corrupt draft should never block checkout; start clean instead.
    return null;
  }
}

async function writeDraft(draft) {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Still usable this session even if it will not survive a restart.
  }
}

export function CheckoutDraftProvider({ children }) {
  // Null until chosen: checkout shows an empty "Select payment method" row and
  // keeps Place Order disabled, rather than defaulting to a wallet nobody
  // picked.
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [deliveryNotes, setDeliveryNotesState] = useState("");
  // Gates the write effect below. Without it the empty initial state would
  // overwrite the stored draft before the read that replaces it has landed.
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await readDraft();
      if (cancelled) {
        return;
      }
      if (stored) {
        setPaymentMethod(stored.paymentMethod ?? null);
        setPaymentPhone(stored.paymentPhone ?? "");
        setDeliveryNotesState(stored.deliveryNotes ?? "");
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void writeDraft({ paymentMethod, paymentPhone, deliveryNotes });
  }, [deliveryNotes, isHydrated, paymentMethod, paymentPhone]);

  const selectPaymentMethod = useCallback((methodId, phone) => {
    setPaymentMethod(methodId);
    setPaymentPhone(phone);
  }, []);

  const setDeliveryNotes = useCallback((note) => {
    setDeliveryNotesState(note);
  }, []);

  // Called once an order is placed, so the next one starts from a clean slate
  // rather than inheriting the previous order's wallet and note.
  const clearCheckoutDraft = useCallback(async () => {
    setPaymentMethod(null);
    setPaymentPhone("");
    setDeliveryNotesState("");
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {
      // The in-memory clear above already took effect; a stale stored copy is
      // overwritten by the next write anyway.
    }
  }, []);

  const value = useMemo(
    () => ({
      paymentMethod,
      paymentPhone,
      deliveryNotes,
      hasPaymentMethod: Boolean(paymentMethod && paymentPhone),
      selectPaymentMethod,
      setDeliveryNotes,
      clearCheckoutDraft,
    }),
    [
      clearCheckoutDraft,
      deliveryNotes,
      paymentMethod,
      paymentPhone,
      selectPaymentMethod,
      setDeliveryNotes,
    ],
  );

  return (
    <CheckoutDraftContext.Provider value={value}>
      {children}
    </CheckoutDraftContext.Provider>
  );
}

export function useCheckoutDraft() {
  const context = useContext(CheckoutDraftContext);
  if (!context) {
    throw new Error(
      "useCheckoutDraft must be used within CheckoutDraftProvider",
    );
  }
  return context;
}
