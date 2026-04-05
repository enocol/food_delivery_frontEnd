import * as Location from "expo-location";

export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    throw new Error(error.message || "Unable to get current location");
  }
}

export async function getLocationAddress(latitude, longitude) {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses.length > 0) {
      const address = addresses[0];
      return {
        street: address.street || "",
        city: address.city || "",
        region: address.region || "",
        postalCode: address.postalCode || "",
        country: address.country || "",
        name: address.name || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Error reverse geocoding location:", error);
    return null;
  }
}
