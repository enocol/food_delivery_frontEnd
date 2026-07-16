import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";

const DEVICE_ID_STORAGE_KEY = "mboloeats.pushDeviceId";

async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}

export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0284c7",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      if (__DEV__) {
        console.warn("[push] Notification permission was not granted");
      }
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse?.data || null;

    if (!token) {
      return null;
    }

    const deviceId = await getOrCreateDeviceId();
    const appVersion =
      Constants.expoConfig?.version ||
      Constants.manifest2?.extra?.expoClient?.version ||
      "1.0.0";
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || null;

    if (__DEV__) {
      console.log("[push] Expo push token:", token);
    }

    return {
      fcm_token: token,
      platform: Platform.OS,
      device_id: deviceId,
      app_version: appVersion,
      locale,
      is_active: true,
    };
  } catch (error) {
    if (__DEV__) {
      console.error("[push] Failed to register for push notifications:", error);
    }
    return null;
  }
}
