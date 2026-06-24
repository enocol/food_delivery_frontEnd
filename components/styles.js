import { StyleSheet } from "react-native";
import * as colors from "../utils/colors";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    fontWeight: "900",
    color: colors.textHeading,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
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
    height: "100%",
    marginTop: 30,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textIconMuted,
    marginTop: 3,
  },
  detailsHeroImage: {
    width: "100%",
    height: 350,
    objectFit: "cover",
  },
});

export default styles;
