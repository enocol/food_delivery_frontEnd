export function formatRestaurantName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}
