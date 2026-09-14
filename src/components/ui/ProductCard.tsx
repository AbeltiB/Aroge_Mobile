import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadow } from '../../constants';
import { RemoteImage } from './RemoteImage';
import { Badge, type BadgeTone } from './Badge';

export interface ProductCardBadge {
  label: string;
  tone: BadgeTone;
}

interface ProductCardProps {
  photoKey?: string | null;
  title: string;
  meta: string;
  priceLabel: string;
  badge?: ProductCardBadge;
  onPress?: () => void;
}

/** The listing grid card used on Home, Search, and My Shop — the one card
 *  shape every browsing surface should share instead of hand-rolling its own. */
export const ProductCard: React.FC<ProductCardProps> = ({ photoKey, title, meta, priceLabel, badge, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.card, Shadow.sm, pressed && styles.pressed]}>
    <View style={styles.imageWrap}>
      <RemoteImage photoKey={photoKey} preset="thumb" style={styles.image} />
      {badge && (
        <View style={styles.badgeSlot}>
          <Badge label={badge.label} tone={badge.tone} shape="tag" />
        </View>
      )}
    </View>
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
      <Text style={styles.price}>{priceLabel}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cream.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  pressed: { opacity: 0.9 },
  imageWrap: { height: 130, backgroundColor: Colors.cream.subtle },
  image: { width: '100%', height: '100%' },
  badgeSlot: { position: 'absolute', top: Spacing[2], left: 0 },
  info: { padding: Spacing[2] + 2 },
  title: { fontFamily: FontFamily.interSemibold, fontSize: FontSize.sm, color: Colors.ink },
  meta: { fontFamily: FontFamily.interRegular, fontSize: 10.5, color: Colors.inkSoft, marginTop: 2 },
  price: { fontFamily: FontFamily.display, fontSize: 13.5, color: Colors.ink, marginTop: 5 },
});
