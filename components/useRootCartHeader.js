import React from "react";
import { useNavigation, useRouter } from "expo-router";
import NotificationHeaderButton from "./NotificationHeaderButton";
import { useNotifications } from "../context/NotificationsContext";

export default function useRootCartHeader(navigation, title, config) {
  const headerHeight = config?.headerHeight;
  const headerBackgroundColor = config?.headerBackgroundColor;
  const headerLeft = config?.headerLeft;
  const headerLeftContainerStyle = config?.headerLeftContainerStyle;
  const routerNavigation = useNavigation();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const targetNavigation =
    navigation && typeof navigation.setOptions === "function"
      ? navigation
      : routerNavigation;

  const handleNotificationPress = React.useCallback(() => {
    router.navigate("/Notifications");
  }, [router]);

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
        <NotificationHeaderButton
          count={unreadCount}
          onPress={handleNotificationPress}
        />
      ),
    });
  }, [
    targetNavigation,
    unreadCount,
    handleNotificationPress,
    title,
    headerHeight,
    headerBackgroundColor,
    headerLeft,
    headerLeftContainerStyle,
  ]);
}
