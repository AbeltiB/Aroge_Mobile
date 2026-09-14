import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, ShieldCheck, BadgeCheck, Zap } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, LetterSpacing } from '../../src/constants';
import { Button, Logo } from '../../src/components/ui';
import { loginWithTelegram } from '../../src/lib/auth';
import { useAppState } from '../../src/context/AppContext';

const VALUE_PROPS = [
  { Icon: ShieldCheck, text: 'Every payment protected by escrow' },
  { Icon: BadgeCheck, text: 'Verified sellers and trusted badges' },
  { Icon: Zap, text: 'Sign in instantly with Telegram' },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTelegramLogin() {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithTelegram();
      if (result) {
        login(result.user);
        router.replace('/(app)/(tabs)');
        return;
      }
      setError('Login cancelled or failed. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing[10], paddingBottom: insets.bottom + Spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.markBackdrop}>
            <Logo size={96} background="cream" />
          </View>
          <Text style={styles.wordmark}>AROGE</Text>
          <Text style={styles.subtitle}>አሮጌ — Ethiopia&apos;s Pre-Loved Marketplace</Text>
        </View>

        <View style={styles.values}>
          {VALUE_PROPS.map(({ Icon, text }) => (
            <View key={text} style={styles.valueRow}>
              <View style={styles.valueIcon}>
                <Icon size={16} color={Colors.green.primary} strokeWidth={2} />
              </View>
              <Text style={styles.valueText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[5] }]}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label={loading ? 'Connecting…' : 'Continue with Telegram'}
          variant="telegram"
          loading={loading}
          onPress={handleTelegramLogin}
          size="lg"
          icon={!loading ? <Send size={18} color="#ffffff" /> : undefined}
        />

        <Text style={styles.legal}>
          By continuing, you agree to Aroge&apos;s Terms of Service and acknowledge our Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
  },
  hero: {
    alignItems: 'center',
  },
  markBackdrop: {
    width: 148,
    height: 148,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
    shadowColor: Colors.green.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  wordmark: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['3xl'],
    color: Colors.green.primary,
    letterSpacing: LetterSpacing.widest,
  },
  subtitle: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  values: {
    marginTop: Spacing[10],
    gap: Spacing[4],
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  valueIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.green.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    flex: 1,
    fontFamily: FontFamily.interMedium,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    gap: Spacing[3],
  },
  errorText: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  legal: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.5,
    paddingHorizontal: Spacing[4],
  },
});
