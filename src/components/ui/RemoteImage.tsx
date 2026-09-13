import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image as ExpoImage, ImageContentFit } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { Colors } from '../../constants';
import { mediaUrl, MediaPresetKey } from '../../lib/media';

interface RemoteImageProps {
  /** MinIO storage key, as stored on the record — not a full URL. */
  photoKey?: string | null;
  preset?: MediaPresetKey;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  rounded?: number;
  /** Custom empty-state icon; defaults to a crossed-out image glyph. */
  fallbackIcon?: React.ReactNode;
}

/**
 * The single path every screen should use to render a listing/user photo —
 * resolves the imgproxy/MinIO URL (sized resize preset), shows a themed
 * placeholder while there's no photo, and gets disk caching + fade-in
 * transitions for free via expo-image.
 */
export const RemoteImage: React.FC<RemoteImageProps> = ({
  photoKey,
  preset = 'thumb',
  style,
  contentFit = 'cover',
  rounded,
  fallbackIcon,
}) => {
  const uri = mediaUrl(photoKey, preset);
  const radiusStyle = rounded !== undefined ? { borderRadius: rounded } : undefined;

  if (!uri) {
    return (
      <View style={[styles.fallback, radiusStyle, style]}>
        {fallbackIcon ?? <ImageOff size={22} color={Colors.text.muted} strokeWidth={1.5} />}
      </View>
    );
  }

  return (
    <ExpoImage
      source={{ uri }}
      style={[radiusStyle, style] as StyleProp<ImageStyle>}
      contentFit={contentFit}
      transition={200}
      cachePolicy="memory-disk"
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.green.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
