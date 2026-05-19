export function formatXaf(amount) {
  if (amount == null) return "";
  return `${amount.toLocaleString("fr-FR")} XAF`;
}
