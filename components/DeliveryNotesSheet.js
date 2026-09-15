import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as colors from "../utils/colors";

export const DELIVERY_NOTES_MAX_LENGTH = 200;

// Far enough that a hesitant drag springs back instead of closing, and a
// flick closes even when it has not travelled that far.
const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 0.8;

// Used before the sheet has measured itself, and as the off-screen target for
// the exit animation - larger than any realistic sheet height.
const OFFSCREEN_FALLBACK = 600;

export default function DeliveryNotesSheet({ visible, value, onSave, onClose }) {
  const insets = useSafeAreaInsets();
  // Kept mounted through the exit animation, otherwise the Modal would vanish
  // the instant `visible` flips and the slide-out would never be seen.
  const [isRendered, setIsRendered] = useState(visible);
  const [draft, setDraft] = useState(value);
  const translateY = useRef(new Animated.Value(OFFSCREEN_FALLBACK)).current;
  const sheetHeightRef = useRef(0);
  const inputRef = useRef(null);
  // Android only. `statusBarTranslucent` puts this Modal in a no-limits window,
  // which disables adjustResize for it - so the keyboard overlaps the sheet
  // instead of shrinking the window, and KeyboardAvoidingView has nothing to
  // react to. Measuring the keyboard and padding by hand is the way out.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const showSub = Keyboard.addListener("keyboardDidShow", (event) =>
      setKeyboardHeight(event.endCoordinates?.height ?? 0),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  // The pan responder is built once, so it reads the current onClose through a
  // ref rather than capturing the first render's copy.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const animateOut = useCallback(
    (afterClose) => {
      Animated.timing(translateY, {
        toValue: sheetHeightRef.current || OFFSCREEN_FALLBACK,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
        if (afterClose) {
          afterClose();
        }
      });
    },
    [translateY],
  );

  useEffect(() => {
    if (visible) {
      // The draft is seeded on each open, so a dismissed edit never leaks into
      // the next one.
      setDraft(value);
      setIsRendered(true);
      translateY.setValue(sheetHeightRef.current || OFFSCREEN_FALLBACK);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dismissing by any route discards the draft - Save is the only thing that
  // commits, which is what makes Cancel meaningful.
  const dismiss = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  const handleSave = useCallback(() => {
    const committed = draft;
    animateOut(() => onSave(committed));
  }, [animateOut, draft, onSave]);

  const panResponder = useRef(
    PanResponder.create({
      // Only claims the gesture once it is clearly a downward drag, so taps
      // and text selection inside the sheet still work.
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          animateOut(onCloseRef.current);
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  if (!isRendered) {
    return null;
  }

  const remaining = `${draft.length}/${DELIVERY_NOTES_MAX_LENGTH}`;

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={isRendered}
      animationType="none"
      onRequestClose={dismiss}
      // autoFocus focuses the input on Android but leaves the soft keyboard
      // shut, because the modal window is not ready to take input yet.
      // onShow fires once it has actually presented; the frame's grace is what
      // Android needs before focus() will raise the keyboard.
      onShow={() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      }}
    >
      <View style={styles.host}>
        {/* Anywhere outside the sheet dismisses it. */}
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Close delivery notes"
          onPress={dismiss}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.keyboardWrap,
            {
              // insets.bottom is added because this Modal's no-limits window
              // extends behind the navigation bar, while Android reports the
              // keyboard height from the visible area above it. Without it the
              // sheet lands exactly one navigation bar too low.
              paddingBottom: keyboardHeight
                ? keyboardHeight + insets.bottom
                : 0,
            },
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={(event) => {
              sheetHeightRef.current = Math.ceil(
                event.nativeEvent.layout.height,
              );
            }}
            style={[
              styles.sheet,
              {
                // The keyboard already occupies the safe area while it is up,
                // so reserving it again would only push the sheet taller on
                // exactly the screens with least room to spare.
                paddingBottom: keyboardHeight
                  ? 12
                  : Math.max(insets.bottom, 12) + 12,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.grabberZone} {...panResponder.panHandlers}>
              <View style={styles.grabber} />
            </View>

            <Text style={styles.title}>Add delivery notes</Text>
            <Text style={styles.body}>
              Leave a note for the rider, like a landmark or which gate to use.
            </Text>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Add your note</Text>
              <Text style={styles.counter}>{remaining}</Text>
            </View>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={'For example: "Blue gate opposite the pharmacy".'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={DELIVERY_NOTES_MAX_LENGTH}
              style={styles.input}
              ref={inputRef}
            />

            <View style={styles.actions}>
              <Pressable
                style={[styles.pill, styles.cancelPill]}
                onPress={dismiss}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, styles.savePill]}
                onPress={handleSave}
                accessibilityRole="button"
              >
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgOverlay,
    opacity: 0.45,
  },
  keyboardWrap: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
  },
  // Generous target so the grabber is easy to catch, and the pan responder
  // is scoped to it rather than the whole sheet - dragging inside the text
  // field should not dismiss.
  grabberZone: {
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: "center",
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMid,
  },
  title: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 20,
    color: colors.textHeading,
    marginTop: 4,
  },
  body: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMid,
    marginTop: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  label: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: colors.textHeading,
  },
  counter: {
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    marginTop: 8,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textHeading,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  pill: {
    minHeight: 48,
    minWidth: 116,
    borderRadius: 999,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelPill: {
    backgroundColor: colors.bgWarmAlt,
  },
  savePill: {
    backgroundColor: "#ff5a1f",
  },
  cancelText: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 15,
    color: colors.textHeading,
  },
  saveText: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 15,
    color: colors.white,
  },
});
