import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ThemeName } from "@/constants/colors";
import { useSubscription } from "@/lib/revenuecat";
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
  loadPremium,
  loadSettings,
  saveManifestItems,
  savePremium,
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
  isPremium: boolean;
  selectedTheme: ThemeName;
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
  unlockPremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  priceString: string;
  isPurchasing: boolean;
  isRestoring: boolean;
  setTheme: (theme: ThemeName) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const {
    isSubscribed,
    offerings,
    purchase: rcPurchase,
    restore: rcRestore,
    isPurchasing,
    isRestoring,
    isLoading: rcLoading,
  } = useSubscription();

  const [todayProgress, setTodayProgress] = useState<DayProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<number, DayProgress>>({});
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("indigo");
  const [manifestItems, setManifestItems] = useState<ManifestItem[]>([]);
  const [archivedJourneys, setArchivedJourneys] = useState<ArchivedJourney[]>([]);

  useEffect(() => {
    if (!rcLoading) {
      setIsPremium(isSubscribed);
      if (isSubscribed) {
        savePremium().catch(() => {});
      }
    }
  }, [isSubscribed, rcLoading]);

  const refreshProgress = useCallback(async () => {
    const premium = await loadPremium();
    setIsPremium(premium);
    const s = await loadSettings();
    if (!s) {
      setIsLoading(false);
      return;
    }
    setSettings(s);
    if (s.selectedTheme) setSelectedTheme(s.selectedTheme);
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
    const withDefaults: UserSettings = {
      selectedTheme: "indigo",
      ...s,
    };
    await saveSettings(withDefaults);
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
    setSettings(withDefaults);
    if (withDefaults.selectedTheme) setSelectedTheme(withDefaults.selectedTheme);
    const day = getCurrentDay(withDefaults.startDate, withDefaults.cycleLength);
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
      if (updated.selectedTheme) setSelectedTheme(updated.selectedTheme);
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

  const unlockPremium = useCallback(async () => {
    const pkg = offerings?.current?.availablePackages[0];
    if (!pkg) {
      console.warn("No package available for purchase");
      return;
    }
    try {
      await rcPurchase(pkg);
    } catch (err: any) {
      if (!err?.userCancelled) {
        console.warn("Purchase failed:", err?.message ?? err);
      }
    }
  }, [offerings, rcPurchase]);

  const restorePurchases = useCallback(async () => {
    try {
      await rcRestore();
    } catch (err: any) {
      console.warn("Restore failed:", err?.message ?? err);
      throw err;
    }
  }, [rcRestore]);

  const setTheme = useCallback(
    async (theme: ThemeName) => {
      if (!settings) return;
      const updated = { ...settings, selectedTheme: theme };
      await saveSettings(updated);
      setSettings(updated);
      setSelectedTheme(theme);
    },
    [settings]
  );

  const startNewJourney = useCallback(
    async (s: UserSettings) => {
      const withDefaults: UserSettings = { selectedTheme: "indigo", ...s };
      if (settings && Object.keys(allProgress).length > 0) {
        await archiveCurrentJourney(settings, allProgress);
      }
      await saveSettings(withDefaults);
      await setOnboarded();
      const granted = await requestNotificationPermission();
      if (granted && withDefaults.notificationsEnabled !== false) {
        await scheduleNotifications(withDefaults.notificationTimes);
      }
      if (withDefaults.intention && withDefaults.intention.trim()) {
        const existingItems = await loadManifestItems();
        const alreadyExists = existingItems.some(
          (item) => item.text.trim() === withDefaults.intention.trim()
        );
        if (!alreadyExists) {
          const newItem: ManifestItem = {
            id: `manifest-${Date.now()}`,
            text: withDefaults.intention.trim(),
            manifested: false,
            createdAt: new Date().toISOString(),
          };
          await saveManifestItems([...existingItems, newItem]);
          setManifestItems([...existingItems, newItem]);
        }
      }
      setSettings(withDefaults);
      if (withDefaults.selectedTheme) setSelectedTheme(withDefaults.selectedTheme);
      const day = getCurrentDay(withDefaults.startDate, withDefaults.cycleLength);
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
        isPremium,
        selectedTheme,
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
        unlockPremium,
        restorePurchases,
        priceString: offerings?.current?.availablePackages[0]?.product?.priceString ?? "£2.99",
        isPurchasing,
        isRestoring,
        setTheme,
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
