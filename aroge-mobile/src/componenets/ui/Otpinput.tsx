import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  FontFamily,
  FontSize,
  Spacing,
} from '../../constants';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * OTPInput — renders N individual digit boxes backed by a single hidden TextInput.
 */
export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  error = false,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const digits = value.split('').slice(0, length);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.wrapper}>
      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Visual digit boxes */}
      {Array.from({ length }).map((_, i) => {
        const isActive = focused && i === digits.length;
        const isFilled = i < digits.length;
        const hasErr = error && value.length === length;

        return (
          <View
            key={i}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
              isActive && styles.boxActive,
              hasErr && styles.boxError,
            ]}
          >
            {isFilled && <Text style={styles.digit}>{digits[i]}</Text>}
            {isActive && <View style={styles.cursor} />}
          </View>
        );
      })}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: Spacing[2],
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.cream.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: Colors.green.primary,
    backgroundColor: `${Colors.green.primary}08`,
  },
  boxActive: {
    borderColor: Colors.green.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}08`,
  },
  digit: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: Colors.green.primary,
  },
});