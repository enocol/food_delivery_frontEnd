import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FOOD_FILTERS } from "../data/foodFilters";
import * as colors from "../utils/colors";

export default function HomeFoodFilter({ selectedFood, setSelectedFood }) {
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
            <View key={food} style={styles.foodFilterItem}>
              <Pressable
                onPress={() =>
                  setSelectedFood((prev) => {
                    if (food === "All") {
                      return "All";
                    }

                    return prev === food ? "All" : food;
                  })
                }
                style={[
                  styles.foodFilterChip,
                  isActive ? styles.foodFilterChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.foodFilterChipText,
                    isActive ? styles.foodFilterChipTextActive : null,
                  ]}
                >
                  {food}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  foodFilterWrap: {
    paddingVertical: 20,
    backgroundColor: colors.white,
  },
  foodFilterScrollContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  foodFilterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderFilterChip,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  foodFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  foodFilterChipText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    fontWeight: "800",
    color: colors.orangeText,
  },
  foodFilterChipTextActive: {
    color: colors.white,
  },
  foodFilterItem: {
    alignItems: "center",
  },
});
