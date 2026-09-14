import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planReminders, type ReminderData } from './reminders';

const CHANNEL_ID = 'hatirlatmalar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Hatırlatmalar',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function resync(data: ReminderData): Promise<void> {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of planReminders(data, new Date())) {
    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body, data: { deadlineId: reminder.deadlineId } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.at,
        channelId: CHANNEL_ID,
      },
    });
  }
}

let queue: Promise<void> = Promise.resolve();

/** Sıralı çalışır: üst üste gelen senkronlar birbirinin planını silmez. */
export function syncNotifications(data: ReminderData): Promise<void> {
  queue = queue
    .then(() => resync(data))
    .catch((error) => console.warn('Bildirim senkronu başarısız', error));
  return queue;
}
