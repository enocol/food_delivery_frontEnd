import AsyncStorage from '@react-native-async-storage/async-storage';

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const OTP_KEY_PREFIX = '@mbolo_eats_otp_';

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

export async function sendOtpEmail(email, otp) {
  const serviceId = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    // Dev mode: print code to console when EmailJS is not configured
    console.warn(`[DEV MODE] OTP for ${email}: ${otp}`);
    return;
  }

  const validUntil = new Date(Date.now() + OTP_EXPIRY_MS).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        // Send common recipient param names so different EmailJS templates work out of the box.
        to_email: email,
        email,
        user_email: email,
        to: email,
        recipient: email,
        passcode: otp,
        time: validUntil,
        otp_code: otp,
        app_name: 'Mbolo Eats',
        company_name: 'Mbolo Eats',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 422) {
      throw new Error(
        'EmailJS rejected the request: recipient is empty. In your EmailJS template, set the To Email field to a variable such as {{to_email}} (or {{email}}), then try again.'
      );
    }
    throw new Error(`Failed to send OTP email (${response.status}): ${text}`);
  }
}
