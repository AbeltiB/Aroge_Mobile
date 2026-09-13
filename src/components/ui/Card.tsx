import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Layout } from '../../constants';

type CardElevation = 'none' | 'sm' | 'md';

interface CardProps {
  children: React.ReactNode;
  elevation?: CardElevation;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Soft-elevated surface — the base for listing cards, order cards, info panels. */
export const Card: React.FC<CardProps> = ({ children, elevation = 'sm', padded = true, style }) => {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        elevation !== 'none' && Shadow[elevation === 'md' ? 'md' : 'sm'],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.cream.surface,
    borderRadius: BorderRadius.lg,
  },
  padded: {
    padding: Layout.cardPadding,
  },
});
