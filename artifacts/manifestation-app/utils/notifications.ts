import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

export async function scheduleNotifications(times: {
  morning: string;
  afternoon: string;
  evening: string;
}): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const morningTime = parseTime(times.morning);
    const afternoonTime = parseTime(times.afternoon);
    const eveningTime = parseTime(times.evening);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Morning Affirmations",
        body: "Time for your morning affirmations",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: morningTime.hour,
        minute: morningTime.minute,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Afternoon Affirmations",
        body: "Pause and align this afternoon",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: afternoonTime.hour,
        minute: afternoonTime.minute,
      },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Evening Affirmations",
        body: "Reflect and reset tonight",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: eveningTime.hour,
        minute: eveningTime.minute,
      },
    });
  } catch {
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
