import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, Layout } from '../../constants';
import { IconButton } from './IconButton';

type HeaderTone = 'surface' | 'brand' | 'action';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Shows a back chevron that calls this (or router.back() if omitted but showBack is true). */
  onBack?: () => void;
  showBack?: boolean;
  tone?: HeaderTone;
  rightActions?: React.ReactNode;
  bordered?: boolean;
}

const toneMap: Record<HeaderTone, { bg: string; fg: string; sub: string; iconTone: 'surface' | 'tint' }> = {
  surface: { bg: Colors.cream.background, fg: Colors.text.primary, sub: Colors.text.muted, iconTone: 'surface' },
  brand: { bg: Colors.green.primary, fg: Colors.text.onGreen, sub: 'rgba(243,239,231,0.7)', iconTone: 'tint' },
  action: { bg: Colors.terracotta.primary, fg: Colors.text.onTerracotta, sub: 'rgba(255,255,255,0.75)', iconTone: 'tint' },
};

/** Standard top bar — back button, title (+ optional subtitle), right-side actions. */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  tone = 'surface',
  rightActions,
  bordered = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = toneMap[tone];

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.bg, paddingTop: insets.top + Spacing[2] },
        bordered && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border.default },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack && (
            <IconButton
              tone={tone === 'surface' ? 'surface' : 'tint'}
              size="md"
              onPress={handleBack}
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={t.fg} />
            </IconButton>
          )}
        </View>

        <View style={styles.center}>
          {title && (
            <Text style={[styles.title, { color: t.fg }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: t.sub }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={[styles.side, styles.rightSide]}>{rightActions}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.headerHeight,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
});
