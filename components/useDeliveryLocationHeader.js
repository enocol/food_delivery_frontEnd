import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import HeaderDeliveryLocation from "./HeaderDeliveryLocation";
import { useDeliveryLocation } from "../context/LocationContext";
import * as colors from "../utils/colors";

// The "Delivery to: ..." header block and the modal it opens, which every
// root tab shows. Both halves were copied verbatim into Home, Orders, and
// Profile - identical JSX and identical styles in all three - so they live
// here instead, and the Basket tab gets them for the cost of one call.

export function DeliveryLocationModal({ visible, address, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop dismisses; the inner Pressable swallows taps so they do
          not fall through to it. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Delivery location</Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Ionicons name="location" size={18} color={colors.orange} />
            <Text style={styles.text}>{address}</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Returns the `headerLeft` render function to hand to `useRootCartHeader`,
 * and the modal element to drop into the screen's tree.
 *
 * `style` and `onLayout` must be stable references - they feed the headerLeft
 * callback, and a new identity on every render would re-run setOptions in a
 * loop. A StyleSheet entry or a useCallback satisfies that; an inline object
 * does not.
 */
export default function useDeliveryLocationHeader({ style, onLayout } = {}) {
  const { deliveryLocation } = useDeliveryLocation();
  const [isVisible, setIsVisible] = React.useState(false);

  const open = React.useCallback(() => setIsVisible(true), []);
  const close = React.useCallback(() => setIsVisible(false), []);

  const headerLeft = React.useCallback(
    () => (
      <HeaderDeliveryLocation
        label={deliveryLocation}
        onPress={open}
        onLayout={onLayout}
        style={style}
      />
    ),
    [deliveryLocation, onLayout, open, style],
  );

  const locationModal = (
    <DeliveryLocationModal
      visible={isVisible}
      address={deliveryLocation}
      onClose={close}
    />
  );

  return { headerLeft, locationModal };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlays.locationBackdrop,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.bgWarm,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderModalWarm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.black,
  },
  title: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 18,
    color: colors.textDark,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  text: {
    fontFamily: "Poppins_400Regular",
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMid,
  },
});
