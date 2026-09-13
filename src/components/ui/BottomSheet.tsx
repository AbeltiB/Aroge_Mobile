import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { haptics } from '../../lib/haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_THRESHOLD = 120;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Fraction of screen height the sheet may grow to at most. Default 0.88. */
  maxHeightRatio?: number;
}

/**
 * Shared bottom-sheet shell — backdrop fade, spring slide-up, drag-down (or
 * fling-down) to dismiss. Replaces the hand-rolled `<Modal>` pattern that
 * used to be duplicated per screen (filters, offer amount, counter-offer,
 * report, review, delivery/payment pickers, ...).
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, title, children, maxHeightRatio = 0.88 }) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200, easing: Easing.in(Easing.ease) });
      backdropOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, translateY, backdropOpacity]);

  const close = () => {
    haptics.tap();
    onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 });
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: SCREEN_HEIGHT * maxHeightRatio, paddingBottom: insets.bottom + Spacing[4] },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
              {title && <Text style={styles.title}>{title}</Text>}
            </View>
          </GestureDetector>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,48,40,0.5)',
  },
  sheet: {
    backgroundColor: Colors.cream.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border.default,
  },
  title: {
    marginTop: Spacing[3],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: Spacing[5],
  },
});
