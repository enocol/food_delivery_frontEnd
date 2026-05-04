import { Audio } from "expo-audio";
import { Platform } from "react-native";

const CART_TICK_SOUND = require("../assets/sounds/cart-tick.wav");

let audioModePromise = null;
let cartTickPlayerPromise = null;

async function ensureAudioMode() {
  if (Platform.OS === "web") {
    return;
  }

  if (!audioModePromise) {
    audioModePromise = Audio.setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch((error) => {
      audioModePromise = null;
      throw error;
    });
  }

  await audioModePromise;
}

async function getCartTickPlayer() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!cartTickPlayerPromise) {
    cartTickPlayerPromise = (async () => {
      await ensureAudioMode();

      const player = Audio.createAudioPlayer(CART_TICK_SOUND);
      player.volume = 0.32;
      return player;
    })().catch((error) => {
      cartTickPlayerPromise = null;
      throw error;
    });
  }

  return cartTickPlayerPromise;
}

export async function playCartTickSound() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const player = await getCartTickPlayer();

    if (!player) {
      return;
    }

    if (player.playing) {
      player.pause();
    }
    await player.seekTo(0);
    player.play();
  } catch {
    // Keep cart actions responsive even if sound playback is unavailable.
  }
}
