import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { FOOD_FILTERS } from "../data/foodFilters";
import * as colors from "../utils/colors";

const ACTIVE_FILTER_ORANGE = "#ff5a1f";

export default function HomeFoodFilter({ selectedFood, setSelectedFood }) {
  const triggerFilterToggleFeedback = async () => {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Vibration.vibrate(20);
    }
  };

  return (
    <View style={styles.foodFilterWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.foodFilterScrollContent}
      >
        {FOOD_FILTERS.map((food) => {
          const isActive = selectedFood === food;
          return (
            <Pressable
              key={food}
              onPress={async () => {
                await triggerFilterToggleFeedback();

                setSelectedFood((prev) => {
                  if (food === "All") {
                    return "All";
                  }

                  return prev === food ? "All" : food;
                });
              }}
              style={[
                styles.foodFilterChip,
                isActive ? styles.foodFilterChipActive : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${food}`}
            >
              <Text
                style={[
                  styles.foodFilterChipText,
                  isActive ? styles.foodFilterChipTextActive : null,
                ]}
                numberOfLines={1}
              >
                {food}
              </Text>

              {isActive ? (
                <View style={styles.foodFilterTickBadge}>
                  <Ionicons name="checkmark" size={11} color={colors.white} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  foodFilterWrap: {
    // First thing under the header, so it carries the gap between the two.
    paddingTop: 16,
    paddingBottom: 14,
  },
  foodFilterScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  foodFilterChip: {
    backgroundColor: colors.bgWarm,
    borderWidth: 1,
    borderRadius: 19,
    borderColor: colors.borderLight,
    minHeight: 38,
    minWidth: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  foodFilterChipActive: {
    backgroundColor: ACTIVE_FILTER_ORANGE,
    borderColor: ACTIVE_FILTER_ORANGE,
    shadowColor: ACTIVE_FILTER_ORANGE,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 6,
  },
  foodFilterChipText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    lineHeight: 20,
    color: "#a79f97",
    textAlign: "center",
  },
  foodFilterChipTextActive: {
    color: colors.white,
  },
  foodFilterTickBadge: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
