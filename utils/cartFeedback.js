import { Audio } from "expo-audio";
import { Platform } from "react-native";

const CART_TICK_SOUND = require("../assets/sounds/cart-tick.wav");
const NOTIFICATION_SOUND = require("../assets/sounds/hint-notification.wav");

let audioModePromise = null;
let cartTickPlayerPromise = null;
let notificationPlayerPromise = null;

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

async function getNotificationPlayer() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!notificationPlayerPromise) {
    notificationPlayerPromise = (async () => {
      // Use a separate setAudioModeAsync call so this player always plays
      // even when the iOS ringer switch is silenced.
      await Audio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "mixWithOthers",
      });
      // Invalidate the cart-tick mode cache so the next cart sound
      // re-applies its own playsInSilentMode:false correctly.
      audioModePromise = null;

      const player = Audio.createAudioPlayer(NOTIFICATION_SOUND);
      player.volume = 1.0;
      return player;
    })().catch((error) => {
      notificationPlayerPromise = null;
      throw error;
    });
  }

  return notificationPlayerPromise;
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

export async function playOrderStatusSound() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const player = await getNotificationPlayer();

    if (!player) {
      return;
    }

    if (player.playing) {
      player.pause();
    }
    await player.seekTo(0);
    player.play();
  } catch {
    // Don't block the notification if sound playback is unavailable.
  }
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
