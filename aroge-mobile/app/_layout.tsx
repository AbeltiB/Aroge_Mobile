import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

// Prevent the native splash screen from auto-hiding before the custom
// animated splash finishes its sequence.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the native splash immediately — app/index.tsx handles the
    // branded animated splash sequence.
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Animated splash entry */}
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          {/* Auth flow */}
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          {/* Main app */}
          <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});