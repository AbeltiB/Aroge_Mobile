import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from auto-hiding before the custom
// animated splash finishes its sequence.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the native splash immediately — our custom animated splash
    // screen (app/index.tsx) handles the branded intro sequence.
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Animated splash entry */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      {/* Auth flow */}
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      {/* Main app */}
      <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
    </Stack>
  );
}