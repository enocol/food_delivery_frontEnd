import { StyleSheet } from "react-native";
import * as colors from "../utils/colors";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  gradientBackground: {
    flex: 1,
    marginTop: -40,
  },
  emptyTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 20,
    color: colors.textHeading,
  },
  emptySub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.textSubMuted,
    marginTop: 6,
    textAlign: "center",
  },
  emptySearchCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderOrange,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    // A percentage height resolves against a FlatList/ScrollView content
    // container, which sizes to its content rather than the viewport -
    // that's an unreliable footgun. A fixed minHeight renders consistently
    // regardless of the parent's flex context.
    minHeight: 260,
    marginTop: 30,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: colors.textIconMuted,
    marginTop: 3,
  },
  detailsHeroImage: {
    width: "100%",
    height: 380,
    objectFit: "cover",
  },
});

export default styles;
