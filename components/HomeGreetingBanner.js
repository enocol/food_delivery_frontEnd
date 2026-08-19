import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import getGreetingPeriod from "../utils/getGreetingPeriod";

export default function HomeGreetingBanner({ customerName = "Alex", now }) {
  const period = useMemo(() => getGreetingPeriod(now || new Date()), [now]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.greetingLine} numberOfLines={1} ellipsizeMode="tail">
        {`Good ${period}, ${customerName}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  greetingLine: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    lineHeight: 20,
    color: "#0f0e0d",
  },
});
