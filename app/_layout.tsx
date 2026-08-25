import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from '../src/context/AppContext';
import { I18nProvider } from '../src/i18n';
import { api } from '../src/lib/api';
import type { Notification } from 'aroge-sdk';

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
              <Text style={pStyles.badgeChar}>አ</Text>
            </View>
          </View>
          <Text style={pStyles.title}>{popup.title}</Text>
          <Text style={pStyles.body}>{popup.body}</Text>
          <TouchableOpacity style={pStyles.btn} onPress={dismiss}>
            <Text style={pStyles.btnText}>Got it</Text>
          </TouchableOpacity>
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <AppProvider>
            <AppShell>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name='index' />
                <Stack.Screen name='onboarding' />
                <Stack.Screen name='(auth)' />
                <Stack.Screen name='(app)' />
                <Stack.Screen name='listing' />
                <Stack.Screen name='order' />
                <Stack.Screen name='checkout' />
                <Stack.Screen name='notifications' />
              </Stack>
            </AppShell>
          </AppProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const pStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 360,
  },
  badgeRow: { marginBottom: 16 },
  badge: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#c89b3c',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeChar: { fontSize: 28, color: '#ffffff', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#1a3028', textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 14, color: '#444444', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: {
    backgroundColor: '#1f7a5a', borderRadius: 10, paddingHorizontal: 40, paddingVertical: 13,
  },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
