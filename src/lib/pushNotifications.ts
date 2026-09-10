import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Push notifications were removed from Expo Go (Android) as of SDK 53 — only
// a real development/production build supports them. Merely importing
// expo-notifications throws inside Expo Go (it's a module-level side
// effect, not something triggered by calling its functions), so it can't be
// a static top-level import here — it has to load lazily, only when we
// already know we're not in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Requests notification permission, fetches the device's Expo push token,
 * and saves it on the user's account. Call this once after login (and on
 * app start for an already-logged-in user) — safe to call repeatedly.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (isExpoGo) return;
  if (!Device.isDevice) return; // push tokens aren't available on simulators/emulators

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#1f7a5a',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  await api.patch('/users/me', { expoPushToken: token.data });
}
