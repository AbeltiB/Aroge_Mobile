import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Shadow } from '../../constants';
import { haptics } from '../../lib/haptics';

type IconButtonTone = 'surface' | 'floating' | 'tint' | 'plain';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  style?: StyleProp<ViewStyle>;
  /** Skip the haptic tap — use for toggle buttons that fire their own feedback */
  silent?: boolean;
}

const sizeMap: Record<IconButtonSize, number> = { sm: 32, md: 40, lg: 48 };

const toneStyles: Record<IconButtonTone, ViewStyle> = {
  surface: { backgroundColor: Colors.cream.surface, borderWidth: 1, borderColor: Colors.border.default },
  floating: { backgroundColor: 'rgba(26,48,40,0.45)' },
  tint: { backgroundColor: Colors.green.tint },
  plain: { backgroundColor: 'transparent' },
};

/** Circular icon-only tap target — back buttons, header actions, save/report over imagery. */
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  tone = 'surface',
  size = 'md',
  onPress,
  disabled,
  silent = false,
  style: customStyle,
  ...rest
}) => {
  const dimension = sizeMap[size];

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (!silent) haptics.tap();
      onPress?.(event);
    },
    [onPress, silent],
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        toneStyles[tone],
        tone === 'floating' && Shadow.sm,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        customStyle,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...rest}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
