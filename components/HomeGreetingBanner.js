import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import getGreetingPeriod from "../utils/getGreetingPeriod";

const HIGHLIGHT_ORANGE = "#ff5a1f";

export default function HomeGreetingBanner({ customerName = "Alex", now }) {
  const period = useMemo(() => getGreetingPeriod(now || new Date()), [now]);

  return (
    <View style={styles.wrap}>
      <Text
        style={styles.greetingLine}
      >{`Good ${period}, ${customerName}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#fffaf0",
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 3,
  },
  greetingLine: {
    fontFamily: "Jakarta Sans",
    fontSize: 12,
    lineHeight: 14,
    color: "#0f0e0d",
    marginBottom: 4,
  },
  headingLine: {
    fontFamily: "Jakarta Sans",
    fontSize: 18,
    lineHeight: 21,
    color: "#0f0e0d",
  },
  headingHighlight: {
    fontFamily: "Jakarta Sans",
    fontSize: 18,
    lineHeight: 21,
    color: HIGHLIGHT_ORANGE,
  },
  headingTail: {
    fontFamily: "Jakarta Sans",
    fontSize: 18,
    lineHeight: 21,
    color: "#0f0e0d",
  },
});
