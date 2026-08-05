import React from "react";
import { useNavigation } from "expo-router";
import CartHeaderButton from "./CartHeaderButton";

export default function useRootCartHeader(
  navigation,
  cartCount,
  titleOrOnCartPress,
  maybeOnCartPress,
  config,
) {
  const hasTitleArg = typeof titleOrOnCartPress === "string";
  const title = hasTitleArg ? titleOrOnCartPress : undefined;
  const onCartPress = hasTitleArg ? maybeOnCartPress : titleOrOnCartPress;
  const headerHeight = config?.headerHeight;
  const headerBackgroundColor = config?.headerBackgroundColor;
  const headerLeft = config?.headerLeft;
  const headerLeftContainerStyle = config?.headerLeftContainerStyle;
  const routerNavigation = useNavigation();

  const targetNavigation =
    navigation && typeof navigation.setOptions === "function"
      ? navigation
      : routerNavigation;

  React.useLayoutEffect(() => {
    if (
      !targetNavigation ||
      typeof targetNavigation.setOptions !== "function"
    ) {
      return;
    }

    targetNavigation.setOptions({
      ...(title !== undefined ? { title } : {}),
      ...(headerHeight
        ? {
            headerStyle: {
              height: headerHeight,
              backgroundColor: headerBackgroundColor,
            },
          }
        : {}),
      ...(headerLeft ? { headerLeft, headerLeftContainerStyle } : {}),
      headerRight: () => (
        <CartHeaderButton count={cartCount} onPress={onCartPress} />
      ),
    });
  }, [
    targetNavigation,
    cartCount,
    onCartPress,
    title,
    headerHeight,
    headerBackgroundColor,
    headerLeft,
    headerLeftContainerStyle,
  ]);
}
