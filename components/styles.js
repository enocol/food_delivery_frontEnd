import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,   
  },

  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,

  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.4,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    height: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,

   
  },

  tabBarBackground: {
    flex: 1,
    shadowColor: '#2f2318',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  tabBarItem: {
    color: '#c4cbbe',
    fontSize: 25,
  },
  tabButtonInner: {
    flex: 1,
    overflow: 'hidden',
   
  },

  tabButtonActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#bd3f1b',
    borderRadius: 24,
  },
  tabButtonContent: {
    flex: 1,
  },

  tabBarLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  sheetHost: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a120d',
  },

  cartSheet: {
    height: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dfe5d9',
  },

  cartAwareContent: {
    paddingBottom: 24,
  },

  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },

  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#c4cbbe',
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#2f2a25',
    paddingHorizontal: 10,
  },

  foodFilterWrap: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  foodFilterScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },

  foodFilterChip: {
    borderColor: '#f0d9bf',
    borderRadius: 18,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  foodFilterChipActive: {
    backgroundColor: "Transparent",
    borderColor: '#bd3f1b',
    borderWidth: 0.5,
  },

  foodFilterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    
  },

  foodFilterChipTextActive: {
  color: '#6b6359',
  },

  foodFilterIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },

  foodFilterItem: {
    alignItems: 'center',
    width: 100,
  },

  // restaurantList: {
  //   paddingHorizontal: 0,
  //   paddingBottom: 20,
  //   marginBottom: 20,
    
  // },

  restaurantCard: {
    borderRadius: 18,
    overflow: 'hidden',
    paddingBottom: 10,
    marginTop: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4d7',
    elevation: 3,
    width: '100%',
  },

  restaurantImage: {
    width: '100%',
    height: 350,
    objectFit: 'cover',
  },

  restaurantContent: {
    padding: 12,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d2a27',
    flex: 1,
  },

  rating: {
    fontSize: 14,
    color: '#7a5610',
    fontWeight: '700',
  },

  metaText: {
    fontSize: 13,
    color: '#5a5249',
    marginTop: 3,
  },

  searchHeaderBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#202420',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#637063',
    marginTop: 5,
    marginBottom: 12,
  },

  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4d7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#202420',
  },

  searchResultsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  searchResultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbe4d7',
    marginBottom: 12,
  },
  searchResultImage: {
    width: '100%',
    height: 130,
  },
  searchResultContent: {
    padding: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#202420',
  },
  emptySearchCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eadfd4',
    padding: 20,
  },
  profileWrap: {
    padding: 16,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#bd3f1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#23201c',
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#6a6258',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#23201c',
    marginBottom: 10,
  },
  infoLine: {
    fontSize: 14,
    color: '#5f5a53',
    marginBottom: 8,
  },
  detailsContainer: {
    paddingBottom: 20,
  },
  detailsTopControls: {
    position: 'relative',
    top: 50,
    left: 12,
    zIndex: 10,
  },
  detailsBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 250, 242, 0.9)',
    borderWidth: 1,
    borderColor: '#eadfd4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsHeroImage: {
    width: '100%',
    height: 350,
    objectFit: 'cover',
  },
  detailsTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#28231d',
    marginTop: 14,
    paddingHorizontal: 14,
  },
  detailsMeta: {
    fontSize: 14,
    color: '#5f5a53',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0e5d4',
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
    fontWeight: '800',
    color: '#302b25',
  },
  menuDescription: {
    fontSize: 12,
    color: '#6b6359',
    marginTop: 4,
  },
  menuPrice: {
    fontSize: 14,
    color: '#2f6f43',
    fontWeight: '700',
    marginTop: 6,
  },
  addButton: {
    backgroundColor: '#bd3f1b',
    marginRight: 10,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  cartHeaderButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#e6ded1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  cartHeaderIcon: {
    fontWeight: '800',
    color: '#bd3f1b',
    fontSize: 24,
   
  },
  cartBadge: {
    backgroundColor: '#bd3f1b',
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 8,
  },
  cartActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#202420',
  },
  clearText: {
    color: '#9a2b1d',
    fontWeight: '700',
  },
  sheetCloseButton: {
    backgroundColor: '#ece8de',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sheetCloseText: {
    color: '#3a352f',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe4d7',
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
    color: '#1f221f',
  },
  cartItemRestaurant: {
    fontSize: 12,
    color: '#657064',
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: '#2f6f43',
    fontWeight: '700',
    marginTop: 4,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d8cb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8f4',
  },
  qtyButtonText: {
    fontWeight: '900',
    color: '#203024',
    fontSize: 16,
  },
  qtyText: {
    width: 28,
    textAlign: 'center',
    fontWeight: '700',
    color: '#203024',
  },
  checkoutBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: '#1f3b2a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetCheckoutBar: {
    marginHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#1f3b2a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentPickerCard: {
    marginHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe4d7',
    borderRadius: 14,
    padding: 12,
  },
  paymentPickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202420',
    marginBottom: 10,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#a9b6a2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentRadioOuterActive: {
    borderColor: '#bd3f1b',
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#bd3f1b',
  },
  paymentOptionLabel: {
    fontSize: 14,
    color: '#2a2f2a',
    fontWeight: '700',
  },
  paymentPhoneInput: {
    marginTop: 8,
    backgroundColor: '#f9fbf8',
    borderWidth: 1,
    borderColor: '#cfdbca',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#202420',
  },
  paymentPhoneError: {
    marginTop: 6,
    fontSize: 12,
    color: '#b42318',
    fontWeight: '700',
  },
  paymentNetworkHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#2f6f43',
    fontWeight: '700',
  },
  checkoutLabel: {
    color: '#d8e8d2',
    fontSize: 12,
  },
  checkoutTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  checkoutButton: {
    backgroundColor: '#f7d694',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  checkoutText: {
    color: '#35210c',
    fontWeight: '800',
  },
  checkoutScreenContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 28,
  },
  checkoutMetaText: {
    fontSize: 14,
    color: '#425045',
    marginTop: 6,
    fontWeight: '700',
  },
  checkoutScreenCta: {
    marginHorizontal: 8,
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#1f3b2a',
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutScreenCtaDisabled: {
    opacity: 0.6,
  },
  checkoutScreenCtaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  checkoutStatusText: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
    fontSize: 13,
    color: '#425045',
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#202420',
  },
  emptySub: {
    fontSize: 14,
    color: '#5f5e5e',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default styles;
