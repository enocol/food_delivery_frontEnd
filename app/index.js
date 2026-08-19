import React from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import * as colors from "../utils/colors";

export default function IndexRoute() {
  const { authLoading } = useAuth();

  if (authLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.splash }} />;
  }

  // Guests and signed-in users land in the same place. The account requirement
  // lives at checkout, not at the entry point.
  return <Redirect href="/MainTabs/HomeTab" />;
}
