import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FOOD_FILTERS, FOOD_FILTER_IMAGES } from "../data/foodFilters";
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
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${food}`}
              >
                {FOOD_FILTER_IMAGES[food] ? (
                  <Image
                    source={{ uri: FOOD_FILTER_IMAGES[food] }}
                    style={styles.foodFilterImage}
                  />
                ) : (
                  <Text
                    style={[
                      styles.foodFilterChipText,
                      isActive ? styles.foodFilterChipTextActive : null,
                    ]}
                  >
                    {food}
                  </Text>
                )}
              </Pressable>
              <Text
                style={[
                  styles.foodFilterLabel,
                  isActive ? styles.foodFilterLabelActive : null,
                ]}
                numberOfLines={2}
              >
                {food}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  foodFilterWrap: {
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  foodFilterScrollContent: {
    paddingHorizontal: 20,
  },
  foodFilterChip: {
    backgroundColor: colors.white,
    // borderWidth: 1,
    borderRadius: 16,
    borderColor: colors.borderFilterChip,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  foodFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  foodFilterImage: {
    width: 44,
    height: 44,
    // borderRadius: 22,
    resizeMode: "cover",
  },
  foodFilterChipText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    fontWeight: "800",
    color: colors.orangeText,
    textAlign: "center",
  },
  foodFilterChipTextActive: {
    color: colors.white,
  },
  foodFilterItem: {
    alignItems: "center",
    width: 72,
    gap: 6,
  },
  foodFilterLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: "center",
  },
  foodFilterLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
