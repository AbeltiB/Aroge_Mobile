import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { formatETB } from '@arogenpm/sdk';
import { Colors, FontFamily, FontSize, FontWeight } from '../../constants';

type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

interface PriceTextProps {
  amount: number;
  size?: PriceSize;
  /** A struck-through original price shown before the current one (offers, bundle savings). */
  originalAmount?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const sizeMap: Record<PriceSize, number> = {
  sm: FontSize.base,
  md: FontSize.lg,
  lg: FontSize.xl,
  xl: FontSize['2xl'],
};

/** Consistent ETB price formatting — serif numerals in the brand gold. */
export const PriceText: React.FC<PriceTextProps> = ({ amount, size = 'md', originalAmount, color, style }) => {
  const fontSize = sizeMap[size];

  return (
    <View style={[styles.row, style]}>
      {originalAmount !== undefined && originalAmount > amount && (
        <Text style={[styles.original, { fontSize: fontSize * 0.68 }]}>{formatETB(originalAmount)}</Text>
      )}
      <Text style={[styles.price, { fontSize, color: color ?? Colors.gold.dark }]}>{formatETB(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontFamily: FontFamily.serif,
    fontWeight: FontWeight.bold,
  },
  original: {
    fontFamily: FontFamily.sans,
    color: Colors.text.muted,
    textDecorationLine: 'line-through',
  },
});
