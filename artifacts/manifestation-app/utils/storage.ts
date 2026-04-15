import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserSettings {
  cycleLength: 33 | 45;
  startDate: string;
  intention: string;
  notificationTimes: {
    morning: string;
    afternoon: string;
    evening: string;
  };
}

export interface SessionData {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

export interface DayProgress {
  dayNumber: number;
  sessions: SessionData;
  completionStatus: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

const KEYS = {
  SETTINGS: "@manifestation/settings",
  PROGRESS: "@manifestation/progress",
  ONBOARDED: "@manifestation/onboarded",
};

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function loadSettings(): Promise<UserSettings | null> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!raw) return null;
  return JSON.parse(raw) as UserSettings;
}

export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === "true";
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, "true");
}

export async function loadAllProgress(): Promise<Record<number, DayProgress>> {
  const raw = await AsyncStorage.getItem(KEYS.PROGRESS);
  if (!raw) return {};
  return JSON.parse(raw) as Record<number, DayProgress>;
}

export async function loadDayProgress(dayNumber: number): Promise<DayProgress> {
  const all = await loadAllProgress();
  if (all[dayNumber]) return all[dayNumber];
  return {
    dayNumber,
    sessions: { morning: [], afternoon: [], evening: [] },
    completionStatus: { morning: false, afternoon: false, evening: false },
  };
}

export async function saveDayProgress(
  dayNumber: number,
  progress: DayProgress
): Promise<void> {
  const all = await loadAllProgress();
  all[dayNumber] = progress;
  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(all));
}

export async function saveSession(
  dayNumber: number,
  session: "morning" | "afternoon" | "evening",
  affirmations: string[]
): Promise<void> {
  const day = await loadDayProgress(dayNumber);
  day.sessions[session] = affirmations;
  day.completionStatus[session] = true;
  await saveDayProgress(dayNumber, day);
}

export function getCurrentDay(startDate: string, cycleLength: number): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const day = Math.min(diffDays + 1, cycleLength);
  return Math.max(1, day);
}

export async function calculateStreak(
  allProgress: Record<number, DayProgress>,
  currentDay: number
): Promise<number> {
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    const day = allProgress[d];
    if (
      day &&
      day.completionStatus.morning &&
      day.completionStatus.afternoon &&
      day.completionStatus.evening
    ) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.SETTINGS, KEYS.PROGRESS, KEYS.ONBOARDED]);
}
