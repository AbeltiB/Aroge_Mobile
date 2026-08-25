import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { handleAuthCallback } from '../../src/lib/auth';
import { useAppState } from '../../src/context/AppContext';
import { colors } from '../../src/lib/colors';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { login } = useAppState();
  const params = useLocalSearchParams<Record<string, string>>();

  useEffect(() => {
    const url = new URLSearchParams(params as Record<string, string>).toString();
    const fullUrl = `aroge://auth/callback?${url}`;

    handleAuthCallback(fullUrl).then((result) => {
      if (result) {
        login(result.user);
        router.replace('/(app)');
      } else {
        router.replace('/(auth)');
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
});
