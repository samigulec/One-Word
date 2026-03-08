import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NotificationSettings } from '../types';

// Varsayilan bildirim ayarlari
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyWordReminder: true,
  dailyWordTime: { hour: 9, minute: 0 },      // Sabah 9:00
  streakReminder: true,
  streakReminderTime: { hour: 20, minute: 0 }, // Aksam 20:00
  quizReminder: true,
  quizReminderTime: { hour: 14, minute: 0 },   // Ogleden sonra 14:00
};

// Bildirim kanali tanimlayicilari
const CHANNEL_IDS = {
  DAILY_WORD: 'daily-word-reminder',
  STREAK: 'streak-reminder',
  QUIZ: 'quiz-reminder',
};

// Bildirim gosterim ayarlari -- uygulama on plandayken de goster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Bildirim izni iste
export const requestNotificationPermission = async (): Promise<boolean> => {
  // Web platformunda bildirim destegi yok
  if (Platform.OS === 'web') return false;

  // Fiziksel cihaz kontrolu
  if (!Device.isDevice) {
    console.log('Bildirimler sadece fiziksel cihazlarda calisir');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android icin bildirim kanali olustur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'One Word',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  return true;
};

// Bildirim izin durumunu kontrol et
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// Tum zamanlanmis bildirimleri iptal et
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Belirli bir bildirim turu icin iptal et
const cancelNotificationsByChannel = async (channelId: string): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    const data = notification.content.data as Record<string, unknown> | undefined;
    if (data?.channelId === channelId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Gunluk kelime hatirlatmasini zamanla
export const scheduleDailyWordReminder = async (
  hour: number,
  minute: number
): Promise<void> => {
  await cancelNotificationsByChannel(CHANNEL_IDS.DAILY_WORD);

  // Gunluk hatirlatma mesajlari (rastgele secilir)
  const messages = [
    { title: 'Yeni kelime seni bekliyor!', body: "Bugunku kelimeni ogren ve serisini uzat." },
    { title: 'Gunun kelimesi hazir!', body: 'Yeni bir kelime ogrenmek icin tikla.' },
    { title: 'Kelime zamani!', body: 'Her gun bir kelime, bir yilda 365 kelime!' },
    { title: 'Ogrenme vakti!', body: 'Bugunku kelimeni kesfet.' },
    { title: 'Hazir misin?', body: 'Yeni bir kelime seni bekliyor!' },
  ];

  const msg = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      data: { channelId: CHANNEL_IDS.DAILY_WORD, type: 'daily_word' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

// Streak hatirlatmasini zamanla
export const scheduleStreakReminder = async (
  hour: number,
  minute: number
): Promise<void> => {
  await cancelNotificationsByChannel(CHANNEL_IDS.STREAK);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Serisini kaybetme!',
      body: 'Bugunku kelimeni henuz gormedin. Serini korumak icin simdi bak!',
      data: { channelId: CHANNEL_IDS.STREAK, type: 'streak' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

// Quiz hatirlatmasini zamanla
export const scheduleQuizReminder = async (
  hour: number,
  minute: number
): Promise<void> => {
  await cancelNotificationsByChannel(CHANNEL_IDS.QUIZ);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Quiz zamani!',
      body: 'Ogrendiklerini test et! Kisa bir quiz seni bekliyor.',
      data: { channelId: CHANNEL_IDS.QUIZ, type: 'quiz' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

// Bildirim ayarlarina gore tum bildirimleri zamanla
export const scheduleAllNotifications = async (
  settings: NotificationSettings
): Promise<void> => {
  // Once mevcut tum zamanlanmis bildirimleri temizle
  await cancelAllNotifications();

  // Bildirimler kapali ise cik
  if (!settings.enabled) return;

  // Izin kontrolu
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  // Gunluk kelime hatirlatmasi
  if (settings.dailyWordReminder) {
    await scheduleDailyWordReminder(
      settings.dailyWordTime.hour,
      settings.dailyWordTime.minute
    );
  }

  // Streak hatirlatmasi
  if (settings.streakReminder) {
    await scheduleStreakReminder(
      settings.streakReminderTime.hour,
      settings.streakReminderTime.minute
    );
  }

  // Quiz hatirlatmasi
  if (settings.quizReminder) {
    await scheduleQuizReminder(
      settings.quizReminderTime.hour,
      settings.quizReminderTime.minute
    );
  }
};
