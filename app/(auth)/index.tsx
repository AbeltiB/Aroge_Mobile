import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { loginWithTelegram } from '../../src/lib/auth';
import { useAppState } from '../../src/context/AppContext';

export default function LoginScreen() {
  const router = useRouter();
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
        router.replace('/(app)');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aroge</Text>
        <Text style={styles.subtitle}>አሮጌ — Ethiopia&apos;s Pre-Loved Marketplace</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Get Started</Text>
        <Text style={styles.cardBody}>
          Buy and sell pre-loved items securely with Aroge Escrow.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.telegramBtn, loading && styles.disabled]}
          onPress={handleTelegramLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAction} size="small" />
          ) : (
            <Text style={styles.telegramBtnText}>Continue with Telegram</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.brand,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 20,
    marginBottom: 24,
  },
  telegramBtn: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  telegramBtnText: {
    color: colors.onAction,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
});