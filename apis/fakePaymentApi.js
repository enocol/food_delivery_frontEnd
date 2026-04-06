function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function requestMobileMoneyPayment({ provider, phone, amountXaf, orderRef }) {
  await wait(1200 + Math.floor(Math.random() * 1000));

  const digits = String(phone ?? "").replace(/\D/g, "");
  const local = digits.startsWith("237") ? digits.slice(3) : digits;

  if (!/^6\d{8}$/.test(local)) {
    return {
      ok: false,
      code: "INVALID_PHONE",
      message: "Payment failed: invalid phone number.",
    };
  }

  if (local.endsWith("000")) {
    return {
      ok: false,
      code: "DECLINED",
      message: `Payment declined by ${provider.toUpperCase()} simulator. Try another number.`,
    };
  }

  return {
    ok: true,
    code: "SUCCESS",
    provider,
    amountXaf,
    orderRef,
    transactionId: randomId(provider.toUpperCase()),
    paidAt: new Date().toISOString(),
  };
}