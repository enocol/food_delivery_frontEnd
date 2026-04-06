import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    marginTop: 25,
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 18,
    padding: 14,
  },
  gradientBackground: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.4,
  },
  tabBar: {
    position: "absolute",
    backgroundColor: "#000000",
    height: 75,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dbe4d7",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 15,
    bottom: 16,
    elevation: 5,
  },

  tabButtonContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  tabBarLabel: {
    fontSize: 12,
    fontWeight: "800",
  },

  sheetHost: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a120d",
  },

  cartSheet: {
    height: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dfe5d9",
  },

  cartAwareContent: {
    paddingBottom: 24,
  },

  sheetHandleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 2,
  },

  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#c4cbbe",
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#2f2a25",
    paddingHorizontal: 10,
  },

  foodFilterWrap: {
    padding: 5,
  },

  foodFilterScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },

  foodFilterChip: {
    borderColor: "#f0d9bf",
    borderRadius: 18,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  foodFilterChipActive: {
    backgroundColor: "Transparent",
    borderColor: "#bd3f1b",
    borderWidth: 0.5,
  },

  foodFilterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
  },

  foodFilterChipTextActive: {
    color: "#6b6359",
  },

  foodFilterIcon: {
    width: 80,
    height: 50,

    marginBottom: 4,
  },

  foodFilterItem: {
    alignItems: "center",
    width: 100,
  },

  restaurantList: {
    paddingBottom: 120,
    gap: 30,
    flexGrow: 1,
  },

  restaurantCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#dbe4d7",
    borderWidth: 1,
    borderColor: "#dbe4d7",
    elevation: 3,
    width: "100%",
  },

  restaurantImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#ffffff",
  },

  restaurantContent: {
    padding: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2d2a27",
    flex: 1,
  },

  rating: {
    fontSize: 14,
    color: "#7a5610",
    fontWeight: "700",
  },

  metaText: {
    fontSize: 13,
    color: "#5a5249",
    marginTop: 3,
  },

  searchHeaderBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#202420",
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#637063",
    marginTop: 5,
    marginBottom: 12,
  },

  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4d7",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#202420",
  },

  searchResultsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  searchResultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dbe4d7",
    marginBottom: 12,
  },
  searchResultImage: {
    width: "100%",
    height: 130,
  },
  searchResultContent: {
    padding: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#202420",
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
  profileWrap: {
    padding: 16,
    gap: 14,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eadfd4",
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#bd3f1b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#23201c",
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 14,
    color: "#6a6258",
  },
  profileSignOutButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#2f2318",
  },
  profileSignOutButtonDisabled: {
    opacity: 0.6,
  },
  profileSignOutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadfd4",
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#23201c",
    marginBottom: 10,
  },
  infoLine: {
    fontSize: 14,
    color: "#5f5a53",
    marginBottom: 8,
  },
  profileLocationButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2f2318",
  },
  profileLocationButtonDisabled: {
    opacity: 0.6,
  },
  profileLocationButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  detailsContainer: {
    paddingBottom: 20,
  },
  detailsTopControls: {
    position: "relative",
    top: 50,
    left: 12,
    zIndex: 10,
  },
  detailsBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 250, 242, 0.9)",
    borderWidth: 1,
    borderColor: "#eadfd4",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsHeroImage: {
    width: "100%",
    height: 350,
    objectFit: "cover",
  },
  detailsTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#28231d",
    marginTop: 14,
    paddingHorizontal: 14,
  },
  detailsMeta: {
    fontSize: 14,
    color: "#5f5a53",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0e5d4",
  },
  menuImage: {
    width: 90,
    height: 90,
  },
  menuTextWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#302b25",
  },
  menuDescription: {
    fontSize: 12,
    color: "#6b6359",
    marginTop: 4,
  },
  menuPrice: {
    fontSize: 14,
    color: "#2f6f43",
    fontWeight: "700",
    marginTop: 6,
  },
  addButton: {
    backgroundColor: "#bd3f1b",
    marginRight: 10,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  cartHeaderButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: "#e6ded1",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 16,
  },
  cartHeaderIcon: {
    fontWeight: "800",
    color: "#bd3f1b",
    fontSize: 24,
  },
  cartBadge: {
    backgroundColor: "#bd3f1b",
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  cartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 8,
  },
  cartActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#202420",
  },
  clearText: {
    color: "#9a2b1d",
    fontWeight: "700",
  },
  sheetCloseButton: {
    backgroundColor: "#ece8de",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sheetCloseText: {
    color: "#3a352f",
    fontSize: 12,
    fontWeight: "800",
  },
  cartList: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },
  cartListSheet: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  cartItemCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe4d7",
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemImage: {
    width: 66,
    height: 66,
    borderRadius: 8,
  },
  cartItemTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f221f",
  },
  cartItemRestaurant: {
    fontSize: 12,
    color: "#657064",
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: "#2f6f43",
    fontWeight: "700",
    marginTop: 4,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d8cb",
    borderRadius: 12,
    overflow: "hidden",
  },
  qtyButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f8f4",
  },
  qtyButtonText: {
    fontWeight: "900",
    color: "#203024",
    fontSize: 16,
  },
  qtyText: {
    width: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#203024",
  },
  checkoutBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: "#1f3b2a",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetCheckoutBar: {
    marginHorizontal: 12,
    marginBottom: 14,
    backgroundColor: "#1f3b2a",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentPickerCard: {
    justifyContent: "center",
    marginBottom: 14,
    marginTop: 29,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4d7",
    borderRadius: 14,
    padding: 12,
    flex: 1,
  },
  paymentPickerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#202420",
    marginBottom: 10,
  },
  paymentOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#a9b6a2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paymentRadioOuterActive: {
    borderColor: "#bd3f1b",
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#bd3f1b",
  },
  paymentOptionLabel: {
    fontSize: 14,
    color: "#2a2f2a",
    fontWeight: "700",
  },
  paymentPhoneInput: {
    marginTop: 8,
    backgroundColor: "#f9fbf8",
    borderWidth: 1,
    borderColor: "#cfdbca",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#202420",
  },
  paymentPhoneError: {
    marginTop: 6,
    fontSize: 12,
    color: "#b42318",
    fontWeight: "700",
  },
  paymentNetworkHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#2f6f43",
    fontWeight: "700",
  },
  checkoutContainer: {
    flex: 0.8,
    justifyContent: "center",
    backgroundColor: "red",
  },

  checkoutLabel: {
    color: "#d8e8d2",
    fontSize: 12,
  },
  checkoutTotal: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  checkoutButton: {
    backgroundColor: "#f7d694",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  checkoutText: {
    color: "#35210c",
    fontWeight: "800",
  },
  checkoutScreenContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 28,
  },
  checkoutMetaText: {
    fontSize: 14,
    color: "#425045",
    marginTop: 6,
    fontWeight: "700",
  },
  checkoutScreenCta: {
    marginHorizontal: 8,
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: "#1f3b2a",
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutScreenCtaDisabled: {
    opacity: 0.6,
  },
  checkoutScreenCtaText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  checkoutStatusText: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
    fontSize: 13,
    color: "#425045",
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#202420",
  },
  emptySub: {
    fontSize: 14,
    color: "#5f5e5e",
    marginTop: 6,
    textAlign: "center",
  },
  authWrap: {
    paddingTop: 30,
    gap: 14,
    flex: 1,
    paddingHorizontal: 16,
  },

  authTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#23201c",
  },
  authSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6a6258",
    lineHeight: 20,
  },
  authCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadfd4",
    gap: 10,
  },

  authInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4d9cd",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 18,

    height: 60,
  },
  authPrimaryButton: {
    marginTop: 2,
    backgroundColor: "#1c069c",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  authPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  authSecondaryButton: {
    borderWidth: 1,
    borderColor: "#e1d6ca",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  authSecondaryButtonDisabled: {
    opacity: 0.55,
  },
  authSecondaryButtonText: {
    color: "#2f2318",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default styles;
