function getGreetingPeriod(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const minutesSinceMidnight = hour * 60 + minute;

  // Morning window: 00:00 to 12:00 (inclusive).
  return minutesSinceMidnight <= 12 * 60 ? "morning" : "evening";
}

export default getGreetingPeriod;
