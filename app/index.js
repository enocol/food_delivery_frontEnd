import React from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import * as colors from "../utils/colors";

export default function IndexRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.splash }} />;
  }

  return <Redirect href={user ? "/MainTabs/HomeTab" : "/Auth"} />;
}
