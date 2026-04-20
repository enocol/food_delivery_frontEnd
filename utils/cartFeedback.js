import { Audio } from "expo-av";
import { Platform } from "react-native";

const CART_TICK_SOUND = require("../assets/sounds/cart-tick.wav");

let audioModePromise = null;
let cartTickSoundPromise = null;

async function ensureAudioMode() {
  if (Platform.OS === "web") {
    return;
  }

  if (!audioModePromise) {
    audioModePromise = Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch((error) => {
      audioModePromise = null;
      throw error;
    });
  }

  await audioModePromise;
}

async function getCartTickSound() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!cartTickSoundPromise) {
    cartTickSoundPromise = (async () => {
      await ensureAudioMode();

      const { sound } = await Audio.Sound.createAsync(CART_TICK_SOUND, {
        shouldPlay: false,
        volume: 0.32,
      });

      return sound;
    })().catch((error) => {
      cartTickSoundPromise = null;
      throw error;
    });
  }

  return cartTickSoundPromise;
}

export async function playCartTickSound() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const sound = await getCartTickSound();

    if (!sound) {
      return;
    }

    await sound.stopAsync().catch(() => undefined);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Keep cart actions responsive even if sound playback is unavailable.
  }
}