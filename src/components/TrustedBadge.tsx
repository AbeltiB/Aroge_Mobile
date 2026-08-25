import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { circle: 18, font: 11 },
  md: { circle: 24, font: 14 },
  lg: { circle: 32, font: 19 },
};

export function TrustedBadge({ size = 'md' }: Props) {
  const dim = SIZES[size];
  return (
    <View style={[styles.circle, { width: dim.circle, height: dim.circle, borderRadius: dim.circle / 2 }]}>
      <Text style={[styles.label, { fontSize: dim.font }]}>አ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#c89b3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: undefined,
    includeFontPadding: false,
  },
});
