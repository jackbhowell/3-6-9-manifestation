import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ArchivedJourney,
  DayProgress,
  ManifestItem,
  UserSettings,
  archiveCurrentJourney,
  calculateStreak,
  deleteArchivedJourney as storageDeleteArchivedJourney,
  deleteCurrentJourney as storageDeleteCurrentJourney,
  getCurrentDay,
  loadAllProgress,
  loadArchivedJourneys,
  loadDayProgress,
  loadManifestItems,
  loadSettings,
  saveManifestItems,
  saveSession,
  saveSettings,
  setOnboarded,
} from "@/utils/storage";
import {
  cancelAllNotifications,
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
  manifestItems: ManifestItem[];
  archivedJourneys: ArchivedJourney[];
  completeOnboarding: (s: UserSettings) => Promise<void>;
  saveAffirmations: (
    session: "morning" | "afternoon" | "evening",
    affirmations: string[]
  ) => Promise<void>;
  refreshProgress: () => Promise<void>;
  updateJourneyName: (name: string) => Promise<void>;
  updateSettings: (updated: UserSettings) => Promise<void>;
  addManifestItem: (text: string) => Promise<void>;
  toggleManifestItem: (id: string) => Promise<void>;
  deleteManifestItem: (id: string) => Promise<void>;
  deleteArchivedJourney: (id: string) => Promise<void>;
  deleteCurrentJourney: () => Promise<void>;
  startNewJourney: (s: UserSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [todayProgress, setTodayProgress] = useState<DayProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<number, DayProgress>>({});
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [manifestItems, setManifestItems] = useState<ManifestItem[]>([]);
  const [archivedJourneys, setArchivedJourneys] = useState<ArchivedJourney[]>([]);

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
    let items = await loadManifestItems();

    // Auto-manifest the intention item when journey is complete
    if (s.intention?.trim()) {
      const start = new Date(s.startDate);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalSessions = s.cycleLength * 3;
      let completedSessions = 0;
      for (const dp of Object.values(all)) {
        if (dp.completionStatus.morning) completedSessions++;
        if (dp.completionStatus.afternoon) completedSessions++;
        if (dp.completionStatus.evening) completedSessions++;
      }
      const isOver = daysElapsed >= s.cycleLength || completedSessions >= totalSessions;
      if (isOver) {
        const intentionText = s.intention.trim();
        const match = items.find((i) => i.text.trim() === intentionText && !i.manifested);
        if (match) {
          items = items.map((i) =>
            i.id === match.id
              ? { ...i, manifested: true, manifestedAt: new Date().toISOString() }
              : i
          );
          await saveManifestItems(items);
        }
      }
    }

    setManifestItems(items);
    const journeys = await loadArchivedJourneys();
    setArchivedJourneys(journeys);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const completeOnboarding = useCallback(async (s: UserSettings) => {
    await saveSettings(s);
    await setOnboarded();
    const granted = await requestNotificationPermission();
    if (granted && s.notificationsEnabled !== false) {
      await scheduleNotifications(s.notificationTimes);
    }
    if (s.intention && s.intention.trim()) {
      const existingItems = await loadManifestItems();
      const alreadyExists = existingItems.some(
        (item) => item.text.trim() === s.intention.trim()
      );
      if (!alreadyExists) {
        const newItem: ManifestItem = {
          id: `manifest-${Date.now()}`,
          text: s.intention.trim(),
          manifested: false,
          createdAt: new Date().toISOString(),
        };
        await saveManifestItems([...existingItems, newItem]);
        setManifestItems([...existingItems, newItem]);
      }
    }
    setSettings(s);
    const day = getCurrentDay(s.startDate, s.cycleLength);
    setCurrentDay(day);
    const today = await loadDayProgress(day);
    setTodayProgress(today);
    setAllProgress({});
    setStreak(0);
    const journeys = await loadArchivedJourneys();
    setArchivedJourneys(journeys);
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

  const updateJourneyName = useCallback(
    async (name: string) => {
      if (!settings) return;
      const updated = { ...settings, journeyName: name };
      await saveSettings(updated);
      setSettings(updated);
    },
    [settings]
  );

  const updateSettings = useCallback(
    async (updated: UserSettings) => {
      await saveSettings(updated);
      setSettings(updated);
      if (updated.notificationsEnabled === false) {
        await cancelAllNotifications();
      } else {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleNotifications(updated.notificationTimes);
        }
      }
    },
    []
  );

  const addManifestItem = useCallback(async (text: string) => {
    const items = await loadManifestItems();
    const newItem: ManifestItem = {
      id: `manifest-${Date.now()}`,
      text,
      manifested: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    await saveManifestItems(updated);
    setManifestItems(updated);
  }, []);

  const toggleManifestItem = useCallback(async (id: string) => {
    const items = await loadManifestItems();
    const updated = items.map((item) =>
      item.id === id
        ? {
            ...item,
            manifested: !item.manifested,
            manifestedAt: !item.manifested ? new Date().toISOString() : undefined,
          }
        : item
    );
    await saveManifestItems(updated);
    setManifestItems(updated);
  }, []);

  const deleteManifestItem = useCallback(async (id: string) => {
    const items = await loadManifestItems();
    const updated = items.filter((item) => item.id !== id);
    await saveManifestItems(updated);
    setManifestItems(updated);
  }, []);

  const deleteArchivedJourney = useCallback(async (id: string) => {
    await storageDeleteArchivedJourney(id);
    const journeys = await loadArchivedJourneys();
    setArchivedJourneys(journeys);
  }, []);

  const deleteCurrentJourney = useCallback(async () => {
    await storageDeleteCurrentJourney();
    setSettings(null);
    setCurrentDay(1);
    setTodayProgress(null);
    setAllProgress({});
    setStreak(0);
    setIsLoading(false);
  }, []);

  const startNewJourney = useCallback(
    async (s: UserSettings) => {
      if (settings && Object.keys(allProgress).length > 0) {
        await archiveCurrentJourney(settings, allProgress);
      }
      await saveSettings(s);
      await setOnboarded();
      const granted = await requestNotificationPermission();
      if (granted && s.notificationsEnabled !== false) {
        await scheduleNotifications(s.notificationTimes);
      }
      if (s.intention && s.intention.trim()) {
        const existingItems = await loadManifestItems();
        const alreadyExists = existingItems.some(
          (item) => item.text.trim() === s.intention.trim()
        );
        if (!alreadyExists) {
          const newItem: ManifestItem = {
            id: `manifest-${Date.now()}`,
            text: s.intention.trim(),
            manifested: false,
            createdAt: new Date().toISOString(),
          };
          await saveManifestItems([...existingItems, newItem]);
          setManifestItems([...existingItems, newItem]);
        }
      }
      setSettings(s);
      const day = getCurrentDay(s.startDate, s.cycleLength);
      setCurrentDay(day);
      const today = await loadDayProgress(day);
      setTodayProgress(today);
      setAllProgress({});
      setStreak(0);
      const journeys = await loadArchivedJourneys();
      setArchivedJourneys(journeys);
      setIsLoading(false);
    },
    [settings, allProgress]
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
        manifestItems,
        archivedJourneys,
        completeOnboarding,
        saveAffirmations,
        refreshProgress,
        updateJourneyName,
        updateSettings,
        addManifestItem,
        toggleManifestItem,
        deleteManifestItem,
        deleteArchivedJourney,
        deleteCurrentJourney,
        startNewJourney,
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
