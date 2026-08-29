import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as colors from "../utils/colors";

// Auth password field with a trailing eye button that toggles the entry
// between masked and plain text, and back on a second press. Owns its own
// reveal state. Matches the plain auth text inputs visually (border sits on
// the row so the error outline still works).
export default function PasswordInput({
  value,
  onChangeText,
  onBlur,
  placeholder,
  hasError = false,
  textContentType = "password",
  autoComplete = "password",
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.row, hasError ? styles.rowError : null]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textDark}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={textContentType}
        autoComplete={autoComplete}
        style={styles.field}
      />
      <Pressable
        onPress={() => setIsVisible((previous) => !previous)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel={isVisible ? "Hide password" : "Show password"}
      >
        <Ionicons
          name={isVisible ? "eye-off-outline" : "eye-outline"}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderInput,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 60,
  },
  rowError: {
    borderColor: colors.danger,
  },
  field: {
    flex: 1,
    color: colors.textDark,
    paddingVertical: 11,
    paddingHorizontal: 0,
    fontSize: 18,
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
