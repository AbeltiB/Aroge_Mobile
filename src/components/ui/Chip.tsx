import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, BorderRadius, Spacing } from '../../constants';
import { haptics } from '../../lib/haptics';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  tone?: 'brand' | 'action';
}

/** Selectable pill — category filters, condition/sort chips, quick replies. */
export const Chip: React.FC<ChipProps> = ({ label, selected = false, onPress, icon, tone = 'brand' }) => {
  const activeBg = tone === 'brand' ? Colors.green.primary : Colors.terracotta.primary;
  const activeFg = tone === 'brand' ? Colors.text.onGreen : Colors.text.onTerracotta;

  const handlePress = useCallback(() => {
    haptics.select();
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        selected ? { backgroundColor: activeBg, borderColor: activeBg } : styles.inactive,
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon}
      <Text style={[styles.label, { color: selected ? activeFg : Colors.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[4],
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  inactive: {
    backgroundColor: Colors.cream.surface,
    borderColor: Colors.border.default,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
