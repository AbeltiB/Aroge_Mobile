import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  FontFamily,
  FontSize,
  Spacing,
} from '../../constants';

interface PhoneInputProps extends Omit<TextInputProps, 'keyboardType' | 'maxLength'> {
  label?: string;
  error?: string;
  /** Defaults to '+251' (Ethiopia) */
  countryCode?: string;
  /** Defaults to 🇪🇹 */
  countryFlag?: string;
}

/**
 * PhoneInput — Ethiopian phone number entry.
 * Displays a fixed +251 prefix and restricts input to 9 digits.
 *
 * Usage:
 *   <PhoneInput
 *     value={phone}
 *     onChangeText={setPhone}
 *     error={phoneError}
 *   />
 */
export const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  (
    {
      label = 'Phone number',
      error,
      countryCode = '+251',
      countryFlag = '🇪🇹',
      value,
      onChangeText,
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

    const handleChange = (text: string) => {
      // Strip non-digits and enforce max 9 characters
      const digits = text.replace(/\D/g, '').slice(0, 9);
      onChangeText?.(digits);
    };

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={[styles.container, { borderColor }]}>
          {/* Country prefix */}
          <View style={styles.prefix}>
            <Text style={styles.flag}>{countryFlag}</Text>
            <Text style={styles.code}>{countryCode}</Text>
            <View style={styles.divider} />
          </View>

          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            maxLength={9}
            placeholder="9 12 34 56 78"
            placeholderTextColor={Colors.text.muted}
            selectionColor={Colors.green.primary}
            returnKeyType="done"
            textContentType="telephoneNumber"
            autoComplete="tel"
            style={styles.input}
            {...rest}
          />
        </View>

        {hasError && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

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
    height: 56,
    overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing[4],
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.default,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[3],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    letterSpacing: 1.5,
    height: '100%',
  },
  error: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.error,
  },
});