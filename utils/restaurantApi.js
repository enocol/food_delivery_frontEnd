import { Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "ios"
    ? "http://192.168.0.152:5000/api"
    : "http://localhost:5000/api";
const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

const RESTAURANTS_ENDPOINT = `${API_BASE_URL.replace(/\/+$/, "")}/restaurants`;

function buildQuery(params) {
  const entries = Object.entries(params).filter(([, value]) =>
    Boolean(String(value || "").trim()),
  );

  if (!entries.length) {
    return "";
  }

  return `?${entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`,
    )
    .join("&")}`;
}

function toEta(minutes) {
  if (typeof minutes === "number") {
    return `${minutes} min`;
  }

  if (typeof minutes === "string" && minutes.trim()) {
    return `${minutes.trim()} min`;
  }

  return "Delivery time unavailable";
}

function mapRestaurant(restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    image: restaurant.imageUrl || DEFAULT_RESTAURANT_IMAGE,
    cuisine: restaurant.cuisine,
    rating: Number(restaurant.rating) || 0,
    deliveryFee: Number(restaurant.deliveryFee) || 0,
    deliveryTimeMinutes: restaurant.deliveryTimeMinutes,
    eta: toEta(restaurant.deliveryTimeMinutes),
    isOpen: Boolean(restaurant.isOpen),
  };
}

function mapMenuItem(item, fallbackImage) {
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    name: item.name,
    description: item.description,
    price: Number(item.price) || 0,
    isAvailable: Boolean(item.isAvailable),
    image: fallbackImage || DEFAULT_RESTAURANT_IMAGE,
  };
}

async function requestJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    let message = "Request failed";

    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // Ignore parse failures and keep fallback message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function fetchRestaurants({ search, cuisine } = {}) {
  const query = buildQuery({ search, cuisine });
  const data = await requestJson(`${RESTAURANTS_ENDPOINT}${query}`);
  return (data.restaurants || []).map(mapRestaurant);
}

export async function fetchRestaurantMenu(restaurantId) {
  const data = await requestJson(
    `${RESTAURANTS_ENDPOINT}/${restaurantId}/menu`,
  );
  const restaurant = mapRestaurant(data.restaurant);
  const menu = (data.menu || []).map((item) =>
    mapMenuItem(item, restaurant.image),
  );

  return {
    restaurant: {
      ...restaurant,
      menu,
    },
    menu,
  };
}
