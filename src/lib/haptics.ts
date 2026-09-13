import * as Haptics from 'expo-haptics';

/**
 * Thin, fire-and-forget haptics wrapper — every call is best-effort (some
 * Android devices/emulators have no haptics engine and expo-haptics
 * rejects there), so every export swallows its own errors.
 */
export const haptics = {
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  select: () => {
    Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
