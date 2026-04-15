import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DayProgress,
  UserSettings,
  calculateStreak,
  getCurrentDay,
  loadAllProgress,
  loadDayProgress,
  loadSettings,
  saveSession,
  saveSettings,
  setOnboarded,
} from "@/utils/storage";
import {
  requestNotificationPermission,
  scheduleNotifications,
} from "@/utils/notifications";

interface AppContextType {
  settings: UserSettings | null;
  currentDay: number;
  todayProgress: DayProgress | null;
  allProgress: Record<number, DayProgress>;
  streak: number;
  isLoading: boolean;
  completeOnboarding: (s: UserSettings) => Promise<void>;
  saveAffirmations: (
    session: "morning" | "afternoon" | "evening",
    affirmations: string[]
  ) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [todayProgress, setTodayProgress] = useState<DayProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<number, DayProgress>>({});
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProgress = useCallback(async () => {
    const s = await loadSettings();
    if (!s) {
      setIsLoading(false);
      return;
    }
    setSettings(s);
    const day = getCurrentDay(s.startDate, s.cycleLength);
    setCurrentDay(day);
    const all = await loadAllProgress();
    setAllProgress(all);
    const today = await loadDayProgress(day);
    setTodayProgress(today);
    const streakCount = await calculateStreak(all, day);
    setStreak(streakCount);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const completeOnboarding = useCallback(async (s: UserSettings) => {
    await saveSettings(s);
    await setOnboarded();
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleNotifications(s.notificationTimes);
    }
    setSettings(s);
    const day = getCurrentDay(s.startDate, s.cycleLength);
    setCurrentDay(day);
    const today = await loadDayProgress(day);
    setTodayProgress(today);
    setAllProgress({});
    setStreak(0);
    setIsLoading(false);
  }, []);

  const saveAffirmations = useCallback(
    async (
      session: "morning" | "afternoon" | "evening",
      affirmations: string[]
    ) => {
      if (!settings) return;
      await saveSession(currentDay, session, affirmations);
      await refreshProgress();
    },
    [settings, currentDay, refreshProgress]
  );

  return (
    <AppContext.Provider
      value={{
        settings,
        currentDay,
        todayProgress,
        allProgress,
        streak,
        isLoading,
        completeOnboarding,
        saveAffirmations,
        refreshProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
