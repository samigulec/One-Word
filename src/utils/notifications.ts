import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTranslation, LanguageCode } from './translations';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const scheduleDailyReminder = async (nativeLanguage: LanguageCode) => {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Cancel existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const title = getTranslation('notifTitle', nativeLanguage);
  const body = getTranslation('notifBody', nativeLanguage);

  // Schedule daily at 10:00 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  });
};
