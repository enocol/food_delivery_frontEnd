// The Google Maps SDK key the Android map preview renders with. Read from the
// environment rather than app.json so the repo carries no account-specific
// value; without it the Android map is a blank grey tile, while iOS (Apple
// Maps) needs no key at all.
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => {
  return {
    ...config,
    newArchEnabled: true,
    android: {
      ...config.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...config.android?.config,
              googleMaps: { apiKey: googleMapsApiKey },
            },
          }
        : {}),
    },
  };
};
