import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing } from '../../constants';

export type BadgeTone = 'neutral' | 'brand' | 'gold' | 'action' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: Colors.cream.subtle, fg: Colors.text.secondary },
  brand: { bg: Colors.green.tint, fg: Colors.green.primary },
  gold: { bg: Colors.gold.primary + '22', fg: Colors.gold.dark },
  action: { bg: Colors.terracotta.tint, fg: Colors.terracotta.primary },
  success: { bg: 'rgba(31,122,90,0.12)', fg: Colors.green.primary },
  warning: { bg: 'rgba(200,155,60,0.18)', fg: Colors.gold.dark },
  error: { bg: 'rgba(192,57,43,0.10)', fg: Colors.error },
  info: { bg: 'rgba(74,90,82,0.10)', fg: Colors.text.secondary },
};

const sizeStyles: Record<BadgeSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
  sm: { paddingHorizontal: Spacing[2], paddingVertical: 3, fontSize: FontSize.xs },
  md: { paddingHorizontal: Spacing[3], paddingVertical: 5, fontSize: FontSize.sm },
};

/** Small status pill — order/listing status, condition, negotiable, trust marks. */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral', size = 'sm', icon, style }) => {
  const t = toneStyles[tone];
  const s = sizeStyles[size];

  return (
    <View style={[styles.base, { backgroundColor: t.bg, paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }, style]}>
      {icon}
      <Text style={[styles.label, { color: t.fg, fontSize: s.fontSize }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
