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

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTime(timeStr: string): { hour: number; minute: number } {
  if (!TIME_RE.test(timeStr)) {
    throw new Error(`Invalid time format "${timeStr}". Expected HH:MM (24-hour).`);
  }
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h as number, minute: m as number };
}

export function validateNotificationTimes(times: {
  morning: string;
  afternoon: string;
  evening: string;
}): string[] {
  const errors: string[] = [];
  for (const [key, val] of Object.entries(times)) {
    if (!TIME_RE.test(val)) {
      errors.push(`${key}: "${val}" is not a valid HH:MM time.`);
    }
  }
  return errors;
}

export async function scheduleNotifications(times: {
  morning: string;
  afternoon: string;
  evening: string;
}): Promise<void> {
  if (Platform.OS === "web") return;

  const validationErrors = validateNotificationTimes(times);
  if (validationErrors.length > 0) {
    throw new Error(`Cannot schedule notifications:\n${validationErrors.join("\n")}`);
  }

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
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
