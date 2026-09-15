import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// The tab bar floats over the bottom of every tab screen, so screens with
// their own pinned content need to know how much room it takes. It measures
// itself and reports here, rather than each screen hardcoding a guess - which
// is what left the cart's checkout button sitting under it.
const TabBarHeightContext = createContext(null);

// How far the bar floats above the safe-area inset (TabBar's `bottom` offset).
export const TAB_BAR_BOTTOM_OFFSET = 16;

export function TabBarHeightProvider({ children }) {
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const reportTabBarHeight = useCallback((height) => {
    const next = Math.ceil(height);
    // Ignoring sub-pixel noise keeps a layout pass from looping.
    setTabBarHeight((previous) =>
      Math.abs(previous - next) <= 1 ? previous : next,
    );
  }, []);

  const value = useMemo(
    () => ({
      tabBarHeight,
      // Total space the bar occupies above the safe-area inset. Screens add
      // this to whatever bottom padding they already apply.
      tabBarClearance: tabBarHeight
        ? tabBarHeight + TAB_BAR_BOTTOM_OFFSET
        : 0,
      reportTabBarHeight,
    }),
    [reportTabBarHeight, tabBarHeight],
  );

  return (
    <TabBarHeightContext.Provider value={value}>
      {children}
    </TabBarHeightContext.Provider>
  );
}

// Safe outside the provider: screens pushed as their own route (the cart is
// reachable both ways) simply get zero clearance, which is correct there.
export function useTabBarHeight() {
  return (
    useContext(TabBarHeightContext) ?? {
      tabBarHeight: 0,
      tabBarClearance: 0,
      reportTabBarHeight: () => {},
    }
  );
}
