import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  FontFamily,
  FontSize,
  Spacing,
} from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  /** Show a clear (×) button when the field has text */
  clearable?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      clearable = false,
      onChangeText,
      value,
      style,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const hasError = !!error;
    const borderColor = hasError
      ? Colors.error
      : focused
      ? Colors.border.focus
      : Colors.border.default;

    const handleClear = () => {
      onChangeText?.('');
    };

    const showClear = clearable && !!value && value.length > 0;

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={[styles.container, { borderColor }]}>
          {leftElement && <View style={styles.leftSlot}>{leftElement}</View>}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              styles.input,
              leftElement ? styles.inputWithLeft : null,
              rightElement || showClear ? styles.inputWithRight : null,
              style,
            ]}
            placeholderTextColor={Colors.text.muted}
            selectionColor={Colors.green.primary}
            {...rest}
          />

          {showClear && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.rightSlot}
              accessibilityLabel="Clear input"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}

          {!showClear && rightElement && (
            <View style={styles.rightSlot}>{rightElement}</View>
          )}
        </View>

        {hasError && <Text style={styles.error}>{error}</Text>}
        {!hasError && hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cream.surface,
    height: 52,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    height: '100%',
  },
  inputWithLeft: {
    paddingLeft: Spacing[2],
  },
  inputWithRight: {
    paddingRight: Spacing[2],
  },
  leftSlot: {
    paddingLeft: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    paddingRight: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  error: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.error,
  },
  hint: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
});