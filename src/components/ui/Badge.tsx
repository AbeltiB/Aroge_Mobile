import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, BorderRadius, Spacing } from '../../constants';

export type BadgeTone = 'neutral' | 'brand' | 'gold' | 'action' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';
/** 'pill' is the default rounded chip; 'tag' is the tailor's swing-tag shape
 *  (notch on the left) used for listing badges (NEW/DEAL/condition) per the
 *  redesign's product-as-motif language — solid tone color, white label. */
type BadgeShape = 'pill' | 'tag';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<BadgeTone, { bg: string; fg: string; solid: string }> = {
  neutral: { bg: Colors.cream.subtle, fg: Colors.text.secondary, solid: Colors.inkSoft },
  brand: { bg: Colors.green.tint, fg: Colors.green.primary, solid: Colors.green.primary },
  gold: { bg: Colors.gold.primary + '22', fg: Colors.gold.dark, solid: Colors.gold.primary },
  action: { bg: Colors.terracotta.tint, fg: Colors.terracotta.primary, solid: Colors.terracotta.primary },
  success: { bg: 'rgba(31,122,90,0.12)', fg: Colors.green.primary, solid: Colors.green.primary },
  warning: { bg: 'rgba(200,155,60,0.18)', fg: Colors.gold.dark, solid: Colors.gold.primary },
  error: { bg: 'rgba(192,57,43,0.10)', fg: Colors.error, solid: Colors.danger },
  info: { bg: 'rgba(74,90,82,0.10)', fg: Colors.text.secondary, solid: Colors.inkSoft },
};

const sizeStyles: Record<BadgeSize, { paddingHorizontal: number; paddingVertical: number; fontSize: number }> = {
  sm: { paddingHorizontal: Spacing[2], paddingVertical: 3, fontSize: FontSize.xs },
  md: { paddingHorizontal: Spacing[3], paddingVertical: 5, fontSize: FontSize.sm },
};

/** Small status pill — order/listing status, condition, negotiable, trust marks. */
export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral', size = 'sm', shape = 'pill', icon, style }) => {
  const t = toneStyles[tone];
  const s = sizeStyles[size];

  if (shape === 'tag') {
    return (
      <View style={[styles.tagRow, style]}>
        <View style={[styles.tagNotch, { borderRightColor: t.solid }]} />
        <View style={[styles.tagBody, { backgroundColor: t.solid, paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }]}>
          {icon}
          <Text style={[styles.tagLabel, { fontSize: s.fontSize }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    );
  }

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
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  tagNotch: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightWidth: 6,
  },
  tagBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.sm,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  tagLabel: {
    fontFamily: FontFamily.interBold,
    color: Colors.cream.background,
    letterSpacing: 0.2,
  },
});
