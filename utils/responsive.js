import { useCallback, useState } from "react";
import { Platform, PixelRatio, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Cards/sheets stop growing past this width so they don't stretch edge to
// edge on tablets (iPad portrait is ~768-834pt wide) — a no-op on phones,
// which never reach this width.
export const CARD_MAX_WIDTH = 640;

const COMPACT_SCREEN_HEIGHT_BREAKPOINT = 750;

// Screens with a custom headerLeft (the "Delivery to: ..." location block)
// all use this same content height by default.
const DEFAULT_HEADER_CONTENT_HEIGHT = 86;

// Default native-stack header row height (title + back button), used to
// clear `headerTransparent: true` screens that don't set a custom height.
const DEFAULT_TRANSPARENT_HEADER_BAR_HEIGHT = Platform.OS === "ios" ? 44 : 56;

// Below this window height (roughly an iPhone SE), screens should shrink
// hero images / top padding so content isn't pushed off a short viewport.
export function useCompactScreen(
  threshold = COMPACT_SCREEN_HEIGHT_BREAKPOINT,
) {
  const { height } = useWindowDimensions();
  return height < threshold;
}

// Height for a custom navigation header whose content (e.g. the location
// row) has a known height at default font scale. Devices with a taller/
// shorter top inset (notch vs. none) or a larger default font scale
// (common on lower-resolution Android phones) need this recalculated per
// device, otherwise headerLeft content overflows past the header and
// overlaps the screen body below it.
export function useRootHeaderHeight(
  contentHeight = DEFAULT_HEADER_CONTENT_HEIGHT,
) {
  const insets = useSafeAreaInsets();
  const fontScale = Math.max(1, PixelRatio.getFontScale());
  return insets.top + contentHeight * fontScale;
}

// Clearance kept above and below the header's content block, so screen content
// can never end up flush against the header's bottom edge.
const HEADER_CONTENT_GUTTER = 18;

// Same job as useRootHeaderHeight, but sized from what the header content
// actually measures instead of guessing it from the font scale. The estimate
// above assumes every part of the block scales with text, which isn't true —
// icons and margins are fixed — so it over-reserves on devices with a large
// font scale and can under-reserve when the content grows for other reasons
// (longer address, taller font metrics). Measuring removes the guess.
//
// Spread `onHeaderContentLayout` onto the headerLeft block being measured.
export function useMeasuredHeaderHeight(
  fallbackContentHeight = DEFAULT_HEADER_CONTENT_HEIGHT,
) {
  const insets = useSafeAreaInsets();
  const fontScale = Math.max(1, PixelRatio.getFontScale());
  const [contentHeight, setContentHeight] = useState(null);

  const onHeaderContentLayout = useCallback((event) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    // The block is centre-aligned rather than stretched, so its height doesn't
    // depend on the header height we derive from it. Ignoring sub-pixel noise
    // keeps that from turning into a re-layout loop anyway.
    setContentHeight((previous) =>
      previous !== null && Math.abs(previous - next) <= 1 ? previous : next,
    );
  }, []);

  const resolved = contentHeight ?? fallbackContentHeight * fontScale;

  return {
    headerHeight: insets.top + resolved + HEADER_CONTENT_GUTTER * 2,
    onHeaderContentLayout,
  };
}

// For headerTransparent screens using the default (non-custom-height)
// native-stack header: the header floats over the screen body, so the body
// must manually reserve this much top space or its content renders behind
// the header's title/back-button row.
export function useTransparentHeaderOffset(extra = 8) {
  const insets = useSafeAreaInsets();
  return insets.top + DEFAULT_TRANSPARENT_HEADER_BAR_HEIGHT + extra;
}
