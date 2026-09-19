import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { NotoSansEthiopic_500Medium, NotoSansEthiopic_700Bold } from '@expo-google-fonts/noto-sans-ethiopic';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from '../src/context/AppContext';
import { I18nProvider } from '../src/i18n';
import { api } from '../src/lib/api';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../src/constants';
import { Button } from '../src/components/ui';
import type { Notification } from '@arogenpm/sdk';

SplashScreen.preventAutoHideAsync().catch(() => {});

const sentryDsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0,
  });
}

function PopupOverlay() {
  const { isAuthenticated, refreshUnread } = useAppState();
  const [popup, setPopup] = useState<Notification | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      const res = await api.get<Notification[]>('/notifications/popups');
      if (res.success && res.data.length > 0) setPopup(res.data[0]);
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const dismiss = async () => {
    if (!popup) return;
    await api.patch(`/notifications/${popup.id}/read`, {});
    await refreshUnread();
    setPopup(null);
  };

  if (!popup) return null;

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={pStyles.backdrop}>
        <View style={pStyles.card}>
          <View style={pStyles.badgeRow}>
            <View style={pStyles.badge}>
              {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
              <Image source={require('../assets/adaptive-icon.png')} style={pStyles.badgeMark} resizeMode="contain" />
            </View>
          </View>
          <Text style={pStyles.title}>{popup.title}</Text>
          <Text style={pStyles.body}>{popup.body}</Text>
          <Button label="Got it" variant="primary" onPress={dismiss} fullWidth={false} style={pStyles.btn} />
        </View>
      </View>
    </Modal>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PopupOverlay />
    </>
  );
}

function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansEthiopic_500Medium,
    NotoSansEthiopic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <AppProvider>
            <AppShell>
              {/* No explicit Stack.Screen children — none of them set per-route
                  options, so they're purely decorative. Most of these route
                  directories (listing/, order/, bundle/, etc.) have no
                  _layout.tsx of their own, so expo-router flattens their
                  files into leaf routes like "bundle/[id]" rather than a
                  collapsible "bundle" group; declaring the bare directory
                  name here doesn't match anything and just produces a
                  "[Layout children]: No route named ..." warning. File-based
                  routing registers every screen automatically regardless. */}
              <Stack screenOptions={{ headerShown: false }} />
            </AppShell>
          </AppProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

const pStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(26,48,40,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing[6],
  },
  card: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius['2xl'], padding: Spacing[8],
    alignItems: 'center', width: '100%', maxWidth: 360,
    ...Shadow.lg,
  },
  badgeRow: { marginBottom: Spacing[4] },
  badge: {
    width: 64, height: 64, borderRadius: BorderRadius.full, backgroundColor: Colors.cream.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border.default,
  },
  badgeMark: { width: 44, height: 44 },
  title: {
    fontFamily: FontFamily.sans, fontSize: FontSize.md, fontWeight: FontWeight.bold,
    color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing[2],
  },
  body: {
    fontFamily: FontFamily.sans, fontSize: FontSize.base, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: FontSize.base * 1.45, marginBottom: Spacing[6],
  },
  btn: { paddingHorizontal: Spacing[10] },
});
