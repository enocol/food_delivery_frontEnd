import React from "react";
import CartScreen from "../../screens/CartScreen";
import { useTabBarHeight } from "../../context/TabBarHeightContext";
import useRootCartHeader from "../../components/useRootCartHeader";
import useDeliveryLocationHeader from "../../components/useDeliveryLocationHeader";
import { headerDeliveryLocationContainerStyle } from "../../components/HeaderDeliveryLocation";
import { useMeasuredHeaderHeight } from "../../utils/responsive";

// The header wiring lives here rather than in CartScreen because the screen is
// shared with the pushed /Cart route, which keeps its back arrow and "Basket"
// title. Two routes, two headers - no need to ask at runtime which one is on.
export default function CartTab({ navigation }) {
  // Measured from the bar itself rather than hardcoded: the previous guess of
  // 68 was ~8pt short, so the tab bar clipped the top of the checkout button.
  // This also tracks the bar if its height changes with the system font scale.
  const { tabBarClearance } = useTabBarHeight();

  // Measured rather than estimated, matching Home - the other solid-header
  // tab. No offset style either: a solid header reserves its own space, so
  // the block does not need the nudge Orders and Profile apply.
  const { headerHeight, onHeaderContentLayout } = useMeasuredHeaderHeight();
  const { headerLeft, locationModal } = useDeliveryLocationHeader({
    onLayout: onHeaderContentLayout,
  });

  useRootCartHeader(navigation, "", {
    headerHeight,
    headerBackgroundColor: "#ff5a1f",
    headerLeft,
    headerLeftContainerStyle: headerDeliveryLocationContainerStyle,
  });

  return (
    <>
      {/* Clearing the basket keeps you on the tab, showing its empty state,
          rather than bouncing you to whichever tab you came from. */}
      <CartScreen bottomClearance={tabBarClearance} dismissOnClear={false} />
      {locationModal}
    </>
  );
}
