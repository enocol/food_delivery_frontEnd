import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gradientBackground: {
    flex: 1,
  },
  emptyTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    fontWeight: "900",
    color: "#202420",
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#5f5e5e",
    marginTop: 6,
    textAlign: "center",
  },
  emptySearchCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "orange",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    marginTop: 30,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#5a5249",
    marginTop: 3,
  },
  detailsHeroImage: {
    width: "100%",
    height: 350,
    objectFit: "cover",
  },
});

export default styles;
