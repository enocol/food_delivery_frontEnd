// Cameroon mobile numbers, shared by checkout and the payment-method screen.
// Local numbers are 9 digits starting with 6; MTN lines run 65-68 and Orange
// lines start 69, which is what ties a number to a mobile-money wallet.

export const PAYMENT_METHODS = [
  { id: "mtn-momo", label: "MTN MoMo" },
  { id: "orange-mobile-money", label: "Orange Money" },
];

export function paymentMethodLabel(methodId) {
  return PAYMENT_METHODS.find((m) => m.id === methodId)?.label || methodId;
}

// Digits only, then grouped for readability as the customer types.
export function formatCameroonPhoneInput(rawValue) {
  const digits = rawValue.replace(/\D/g, "");
  const hasCountryCode = digits.startsWith("237");
  const local = hasCountryCode ? digits.slice(3, 12) : digits.slice(0, 9);

  if (!local) {
    return hasCountryCode ? "+237 " : "";
  }

  const p1 = local.slice(0, 3);
  const p2 = local.slice(3, 6);
  const p3 = local.slice(6, 9);
  const grouped = [p1, p2, p3].filter(Boolean).join(" ");

  return hasCountryCode ? `+237 ${grouped}` : grouped;
}

// Called with a payment method, this also checks the number sits on that
// wallet's network. Called without one, it checks the shape only - a delivery
// contact line has no reason to match the wallet being charged.
export function validateCameroonPhone(rawPhone, paymentMethod) {
  const digits = rawPhone.replace(/\D/g, "");
  const local = digits.startsWith("237") ? digits.slice(3) : digits;
  const isValid = /^6\d{8}$/.test(local);

  if (!isValid) {
    return {
      isValid: false,
      message:
        "Enter a valid Cameroon number (e.g. 6XXXXXXXX or +2376XXXXXXXX).",
    };
  }

  if (paymentMethod === "mtn-momo" && !/^6[5-8]/.test(local)) {
    return {
      isValid: false,
      message:
        "MTN MoMo requires an MTN line (typically starting with 65, 66, 67, or 68).",
    };
  }

  if (paymentMethod === "orange-mobile-money" && !/^69/.test(local)) {
    return {
      isValid: false,
      message:
        "Orange Money requires an Orange line (typically starting with 69).",
    };
  }

  return { isValid: true };
}

export function detectNetworkFromPhone(rawPhone) {
  const digits = rawPhone.replace(/\D/g, "");
  const local = digits.startsWith("237") ? digits.slice(3) : digits;

  if (!/^6\d{8}$/.test(local)) {
    return null;
  }

  if (/^69/.test(local)) {
    return "Orange";
  }

  if (/^6[5-8]/.test(local)) {
    return "MTN";
  }

  return "Unknown";
}

// E.164, which is what the order payload and the payment provider expect.
export function toE164(rawPhone) {
  const digits = rawPhone.replace(/\D/g, "").replace(/^237/, "");
  return `+237${digits}`;
}
