import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Colors, FontFamily } from '../../constants';
import { mediaUrl } from '../../lib/media';

interface AvatarProps {
  photoKey?: string | null;
  name?: string | null;
  size?: number;
  tone?: 'brand' | 'action';
}

function initialsFrom(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

/** User avatar — real photo when available, initials-on-tint otherwise. */
export const Avatar: React.FC<AvatarProps> = ({ photoKey, name, size = 44, tone = 'brand' }) => {
  const uri = mediaUrl(photoKey, 'small');
  const bg = tone === 'brand' ? Colors.green.tint : Colors.terracotta.tint;
  const fg = tone === 'brand' ? Colors.green.primary : Colors.terracotta.primary;

  if (uri) {
    return (
      <ExpoImage
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { color: fg, fontSize: size * 0.38 }]}>{initialsFrom(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.cream.subtle,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FontFamily.sans,
    fontWeight: '700',
  },
});
