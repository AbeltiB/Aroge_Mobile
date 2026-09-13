import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants';
import { haptics } from '../../lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'telegram';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantStyles = {
  primary: {
    container: { backgroundColor: Colors.terracotta.primary, borderWidth: 0 },
    pressed: { backgroundColor: Colors.terracotta.pressed },
    label: { color: Colors.text.onTerracotta },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.green.primary },
    pressed: { backgroundColor: Colors.green.tint },
    label: { color: Colors.green.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0 },
    pressed: { backgroundColor: Colors.cream.subtle },
    label: { color: Colors.green.primary },
  },
  danger: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.error },
    pressed: { backgroundColor: 'rgba(192,57,43,0.08)' },
    label: { color: Colors.error },
  },
  telegram: {
    container: { backgroundColor: Colors.telegram, borderWidth: 0 },
    pressed: { backgroundColor: Colors.telegramDark },
    label: { color: '#ffffff' },
  },
} as const;

const sizeStyles = {
  sm: { container: { height: 40, paddingHorizontal: Spacing[3] }, label: { fontSize: FontSize.sm }, gap: 6 },
  md: { container: { height: 52, paddingHorizontal: Spacing[5] }, label: { fontSize: FontSize.base }, gap: 8 },
  lg: { container: { height: 60, paddingHorizontal: Spacing[6] }, label: { fontSize: FontSize.md }, gap: 10 },
} as const;

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  onPress,
  disabled,
  style: customStyle,
  textStyle: customTextStyle,
  ...rest
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      haptics.tap();
      onPress?.(event);
    },
    [onPress],
  );

  const isDisabled = disabled || loading;
  const hasShadow = variant === 'primary' || variant === 'telegram';

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        hasShadow && Shadow.sm,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyle.pressed,
        isDisabled && styles.disabled,
        customStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.label.color} size="small" />
      ) : (
        <View style={[styles.content, { gap: sizeStyle.gap }]}>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[styles.label, sizeStyle.label, variantStyle.label, customTextStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.48,
  },
});
