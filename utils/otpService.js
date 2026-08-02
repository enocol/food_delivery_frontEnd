import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const OTP_KEY_PREFIX = "@mbolo_eats_otp_";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(email, otp) {
  const record = JSON.stringify({
    otp,
    expiry: Date.now() + OTP_EXPIRY_MS,
  });
  await AsyncStorage.setItem(OTP_KEY_PREFIX + email.toLowerCase(), record);
}

export async function verifyOtp(email, code) {
  const raw = await AsyncStorage.getItem(OTP_KEY_PREFIX + email.toLowerCase());
  if (!raw) return false;

  const { otp, expiry } = JSON.parse(raw);

  if (Date.now() > expiry) {
    await AsyncStorage.removeItem(OTP_KEY_PREFIX + email.toLowerCase());
    return false;
  }

  const valid = otp === code.trim();
  if (valid) {
    await AsyncStorage.removeItem(OTP_KEY_PREFIX + email.toLowerCase());
  }
  return valid;
}
