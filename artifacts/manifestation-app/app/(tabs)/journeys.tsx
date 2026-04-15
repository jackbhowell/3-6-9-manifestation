import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
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
import { ArchivedJourney } from "@/utils/storage";

function completionPercent(progress: ArchivedJourney["progress"], cycleLength: number): number {
  const totalSessions = cycleLength * 3;
  let done = 0;
  for (const day of Object.values(progress)) {
    if (day.completionStatus.morning) done++;
    if (day.completionStatus.afternoon) done++;
    if (day.completionStatus.evening) done++;
  }
  return Math.round((done / totalSessions) * 100);
}

function todayCompletionPercent(
  status: { morning: boolean; afternoon: boolean; evening: boolean } | null
): number {
  if (!status) return 0;
  const done = [status.morning, status.afternoon, status.evening].filter(Boolean).length;
  return Math.round((done / 3) * 100);
}

export default function JourneysScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings,
    currentDay,
    streak,
    todayProgress,
    allProgress,
    archivedJourneys,
  } = useApp();

  const journeyNumber = archivedJourneys.length + 1;
  const journeyName = settings?.journeyName || `Journey ${journeyNumber}`;
  const todayPct = todayCompletionPercent(todayProgress?.completionStatus ?? null);

  const activeCompletion = (() => {
    if (!settings) return 0;
    const totalSessions = settings.cycleLength * 3;
    let done = 0;
    for (const day of Object.values(allProgress)) {
      if (day.completionStatus.morning) done++;
      if (day.completionStatus.afternoon) done++;
      if (day.completionStatus.evening) done++;
    }
    return Math.round((done / totalSessions) * 100);
  })();

  return (
    <GradientBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 110),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Journeys</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Every path you've walked
          </Text>
        </View>

        {settings && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              ACTIVE
            </Text>
            <Pressable
              onPress={() => router.push("/")}
              style={[
                styles.activeCard,
                { backgroundColor: colors.secondary, borderColor: colors.primary },
              ]}
            >
              <View style={styles.activeCardTop}>
                <View style={styles.activeCardMeta}>
                  <Text style={[styles.activeLabel, { color: colors.mutedForeground }]}>
                    DAY {currentDay} OF {settings.cycleLength}
                  </Text>
                  <Text style={[styles.activeName, { color: colors.foreground }]}>
                    {journeyName}
                  </Text>
                  {settings.intention ? (
                    <Text
                      style={[styles.activeIntention, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {settings.intention}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.practiceBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatChip label="Streak" value={`${streak}d`} colors={colors} />
                <StatChip label="Today" value={`${todayPct}%`} colors={colors} />
                <StatChip label="Overall" value={`${activeCompletion}%`} colors={colors} />
              </View>
            </Pressable>
          </>
        )}

        {archivedJourneys.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              COMPLETED
            </Text>
            <View style={styles.archivedList}>
              {[...archivedJourneys].reverse().map((journey, idx) => {
                const pct = completionPercent(journey.progress, journey.cycleLength);
                const startDate = new Date(journey.startDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const endDate = new Date(journey.endDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <Pressable
                    key={journey.id}
                    onPress={() =>
                      router.push({
                        pathname: "/journey-detail",
                        params: { journeyId: journey.id },
                      })
                    }
                    style={[
                      styles.archivedCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.archivedTop}>
                      <View style={styles.archivedMeta}>
                        <Text style={[styles.archivedName, { color: colors.foreground }]}>
                          {journey.name}
                        </Text>
                        <Text style={[styles.archivedDates, { color: colors.mutedForeground }]}>
                          {startDate} – {endDate}
                        </Text>
                      </View>
                      <View style={styles.archivedRight}>
                        <Text style={[styles.archivedPct, { color: colors.primary }]}>
                          {pct}%
                        </Text>
                        <Text style={[styles.archivedPctLabel, { color: colors.mutedForeground }]}>
                          complete
                        </Text>
                      </View>
                    </View>
                    {journey.intention ? (
                      <Text
                        style={[styles.archivedIntention, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        "{journey.intention}"
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {!settings && archivedJourneys.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.primary }]}>◎</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your first journey awaits
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Complete onboarding to begin your 3-6-9 practice and your journeys will be recorded here.
            </Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

function StatChip({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.chipValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  activeCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  activeCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  activeCardMeta: {
    flex: 1,
    gap: 4,
  },
  activeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  activeName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  activeIntention: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 18,
  },
  practiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  chipValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  chipLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  archivedList: {
    gap: 10,
  },
  archivedCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  archivedTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  archivedMeta: {
    flex: 1,
    gap: 3,
  },
  archivedName: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  archivedDates: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  archivedRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  archivedPct: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  archivedPctLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  archivedIntention: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
});
