import React, { useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing } from '../../constants';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A single pulsing placeholder box. Compose these into skeleton layouts per screen. */
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, radius = BorderRadius.sm, style }) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
};

/** 2-column grid card skeleton — matches the listing card shape on Home/Search. */
export const SkeletonListingCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton height={140} radius={BorderRadius.lg} />
    <View style={{ gap: 6, marginTop: Spacing[2] }}>
      <Skeleton height={13} width="90%" />
      <Skeleton height={13} width="50%" />
      <Skeleton height={16} width="40%" />
    </View>
  </View>
);

/** Horizontal list row skeleton — messages, orders, notifications. */
export const SkeletonRow: React.FC = () => (
  <View style={styles.row}>
    <Skeleton width={48} height={48} radius={BorderRadius.full} />
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="45%" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.cream.subtle,
  },
  card: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
});
