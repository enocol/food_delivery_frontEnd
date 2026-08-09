import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);
const STORAGE_KEY_PREFIX = "mboloeats.notifications";
const MAX_NOTIFICATIONS = 100;

function getStorageKey(firebaseUid) {
  return `${STORAGE_KEY_PREFIX}.${firebaseUid}`;
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function buildNotificationId(input) {
  const data = input?.data || {};
  const candidate =
    data.notificationId ||
    data.notification_id ||
    data.id ||
    data.orderId ||
    data.order_id ||
    input?.identifier;

  if (candidate) {
    return String(candidate);
  }

  return `${input?.createdAt || Date.now()}:${input?.title || "notification"}:${input?.body || ""}`;
}

function normalizeNotification(item) {
  if (!item) {
    return null;
  }

  const data = item?.data && typeof item.data === "object" ? item.data : {};
  const title = String(item?.title || data.title || "Notification").trim();
  const body = String(item?.body || data.body || "").trim();
  const createdAt = toIsoDate(item?.createdAt || item?.date);
  const id = buildNotificationId({
    ...item,
    data,
    title,
    body,
    createdAt,
  });

  return {
    id,
    title,
    body,
    data,
    createdAt,
    read: Boolean(item?.read),
  };
}

function sortAndTrimNotifications(items) {
  return items
    .filter(Boolean)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS);
}

function parseStoredNotifications(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortAndTrimNotifications(parsed.map(normalizeNotification));
  } catch {
    return [];
  }
}

export function createStoredNotificationFromExpo(notification) {
  if (!notification) {
    return null;
  }

  const content = notification?.request?.content || notification?.content || {};
  const data =
    content?.data && typeof content.data === "object" ? content.data : {};

  return normalizeNotification({
    identifier: notification?.request?.identifier || notification?.identifier,
    title: content?.title,
    body: content?.body,
    data,
    createdAt: notification?.date,
    read: false,
  });
}

export function NotificationsProvider({ children }) {
  const { firebaseUid } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const persistNotifications = useCallback(
    (nextNotifications) => {
      if (!firebaseUid) {
        return;
      }

      AsyncStorage.setItem(
        getStorageKey(firebaseUid),
        JSON.stringify(nextNotifications),
      ).catch(() => {});
    },
    [firebaseUid],
  );

  const updateNotifications = useCallback(
    (updater) => {
      setNotifications((currentNotifications) => {
        const nextNotifications = sortAndTrimNotifications(
          updater(currentNotifications),
        );
        persistNotifications(nextNotifications);
        return nextNotifications;
      });
    },
    [persistNotifications],
  );

  useEffect(() => {
    if (!firebaseUid) {
      setNotifications([]);
      return undefined;
    }

    let isActive = true;

    AsyncStorage.getItem(getStorageKey(firebaseUid))
      .then((storedValue) => {
        if (!isActive) {
          return;
        }

        setNotifications(parseStoredNotifications(storedValue));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setNotifications([]);
      });

    return () => {
      isActive = false;
    };
  }, [firebaseUid]);

  const saveNotification = useCallback(
    (incomingNotification) => {
      const normalizedNotification =
        normalizeNotification(incomingNotification);

      if (!normalizedNotification) {
        return;
      }

      updateNotifications((currentNotifications) => {
        const existingNotification = currentNotifications.find(
          (item) => item.id === normalizedNotification.id,
        );

        const nextNotification = existingNotification
          ? {
              ...normalizedNotification,
              read: existingNotification.read,
            }
          : normalizedNotification;

        return [
          nextNotification,
          ...currentNotifications.filter(
            (item) => item.id !== normalizedNotification.id,
          ),
        ];
      });
    },
    [updateNotifications],
  );

  const saveExpoNotification = useCallback(
    (notification) => {
      const storedNotification = createStoredNotificationFromExpo(notification);

      if (!storedNotification) {
        return;
      }

      saveNotification(storedNotification);
    },
    [saveNotification],
  );

  const markAsRead = useCallback(
    (notificationId) => {
      updateNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        ),
      );
    },
    [updateNotifications],
  );

  const markAllAsRead = useCallback(() => {
    updateNotifications((currentNotifications) =>
      currentNotifications.map((item) => ({ ...item, read: true })),
    );
  }, [updateNotifications]);

  const deleteNotification = useCallback(
    (notificationId) => {
      updateNotifications((currentNotifications) =>
        currentNotifications.filter((item) => item.id !== notificationId),
      );
    },
    [updateNotifications],
  );

  const clearNotifications = useCallback(() => {
    updateNotifications(() => []);
  }, [updateNotifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      saveNotification,
      saveExpoNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications,
    }),
    [
      clearNotifications,
      deleteNotification,
      markAllAsRead,
      markAsRead,
      notifications,
      saveExpoNotification,
      saveNotification,
      unreadCount,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }

  return context;
}
