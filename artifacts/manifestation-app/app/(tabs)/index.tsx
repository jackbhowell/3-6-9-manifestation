import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { isOnboarded } from "@/utils/storage";

type Session = "morning" | "afternoon" | "evening";

interface SessionConfig {
  key: Session;
  label: string;
  count: number;
  icon: string;
  time: string;
}

const SESSION_CONFIG: SessionConfig[] = [
  { key: "morning", label: "Morning", count: 3, icon: "sunrise", time: "3 affirmations" },
  { key: "afternoon", label: "Afternoon", count: 6, icon: "sun", time: "6 affirmations" },
  { key: "evening", label: "Evening", count: 9, icon: "moon", time: "9 affirmations" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, currentDay, todayProgress, streak, isLoading, refreshProgress } =
    useApp();

  useEffect(() => {
    async function checkOnboarding() {
      const boarded = await isOnboarded();
      if (!boarded) {
        router.replace("/onboarding");
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    refreshProgress();
  }, []);

  if (isLoading || !settings) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </GradientBackground>
    );
  }

  function getNextAvailableSession(): Session | null {
    const status = todayProgress?.completionStatus;
    if (!status) return "morning";
    if (!status.morning) return "morning";
    if (!status.afternoon) return "afternoon";
    if (!status.evening) return "evening";
    return null;
  }

  const nextSession = getNextAvailableSession();
  const allDone = nextSession === null;
  const cycleComplete = currentDay >= settings.cycleLength && allDone;

  function canStartSession(session: Session): boolean {
    const status = todayProgress?.completionStatus;
    if (!status) return session === "morning";
    if (session === "morning") return !status.morning;
    if (session === "afternoon") return status.morning && !status.afternoon;
    if (session === "evening") return status.morning && status.afternoon && !status.evening;
    return false;
  }

  function isSessionComplete(session: Session): boolean {
    return todayProgress?.completionStatus[session] ?? false;
  }

  function startSession(session: Session) {
    router.push({ pathname: "/affirmation", params: { session } });
  }

  const progressPct = (() => {
    const completed = Object.values(todayProgress?.completionStatus ?? {}).filter(Boolean).length;
    return (completed / 3) * 100;
  })();

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
              DAY {currentDay} OF {settings.cycleLength}
            </Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {allDone ? "Day Complete" : "Your Practice"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/progress")}
            style={[styles.progressBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="bar-chart-2" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {settings.intention ? (
          <View style={[styles.intentionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.intentionLabel, { color: colors.mutedForeground }]}>
              YOUR INTENTION
            </Text>
            <Text style={[styles.intentionText, { color: colors.foreground }]}>
              {settings.intention}
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Day streak
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {Math.round(progressPct)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Today
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {settings.cycleLength - currentDay}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Days left
            </Text>
          </View>
        </View>

        <View style={styles.sessionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            TODAY'S SESSIONS
          </Text>
          {SESSION_CONFIG.map((sess, idx) => {
            const complete = isSessionComplete(sess.key);
            const canStart = canStartSession(sess.key);
            const locked = !complete && !canStart;

            return (
              <Pressable
                key={sess.key}
                onPress={() => canStart && startSession(sess.key)}
                testID={`session-${sess.key}`}
                style={[
                  styles.sessionCard,
                  {
                    backgroundColor: complete
                      ? colors.secondary
                      : colors.card,
                    borderColor: complete
                      ? colors.primary
                      : canStart
                      ? colors.accent
                      : colors.border,
                    opacity: locked ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.sessionIcon,
                    {
                      backgroundColor: complete
                        ? colors.accent
                        : colors.secondary,
                    },
                  ]}
                >
                  <Feather
                    name={complete ? "check" : (sess.icon as any)}
                    size={20}
                    color={complete ? colors.foreground : colors.primary}
                  />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionLabel, { color: colors.foreground }]}>
                    {sess.label}
                  </Text>
                  <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>
                    {complete ? "Completed" : sess.time}
                  </Text>
                </View>
                {!complete && (
                  <View>
                    {canStart ? (
                      <Feather
                        name="arrow-right"
                        size={20}
                        color={colors.primary}
                      />
                    ) : (
                      <Feather
                        name="lock"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {allDone && (
          <View
            style={[
              styles.doneCard,
              { backgroundColor: colors.secondary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.doneTitle, { color: colors.primary }]}>
              {cycleComplete ? "Cycle Complete!" : "Day Complete!"}
            </Text>
            <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>
              {cycleComplete
                ? `You've completed your ${settings.cycleLength}-day journey. Well done.`
                : "All sessions done. Rest and return tomorrow."}
            </Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  progressBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  intentionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  intentionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  intentionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  sessionsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionLabel: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  sessionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  doneCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: "center",
  },
  doneTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  doneBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
