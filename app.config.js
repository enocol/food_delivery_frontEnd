const appJson = require("./app.json");

module.exports = ({ config }) => {
  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      newArchEnabled: false,
    },
  };
};
