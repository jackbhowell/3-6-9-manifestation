import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { ArchivedJourney } from "@/utils/storage";

export default function JourneyDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { journeyId } = useLocalSearchParams<{ journeyId: string }>();
  const { archivedJourneys, isPremium, unlockPremium } = useApp();

  const journey: ArchivedJourney | undefined = archivedJourneys.find(
    (j) => j.id === journeyId
  );

  if (!journey) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
            Journey not found
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backFallback}>
            <Text style={[styles.backFallbackText, { color: colors.primary }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  const startDate = new Date(journey.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endDate = new Date(journey.endDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let completedDays = 0;
  let totalSessions = 0;
  let doneSessions = 0;
  for (let d = 1; d <= journey.cycleLength; d++) {
    const day = journey.progress[d];
    totalSessions += 3;
    if (day) {
      if (day.completionStatus.morning) doneSessions++;
      if (day.completionStatus.afternoon) doneSessions++;
      if (day.completionStatus.evening) doneSessions++;
      if (
        day.completionStatus.morning &&
        day.completionStatus.afternoon &&
        day.completionStatus.evening
      ) {
        completedDays++;
      }
    }
  }
  const pct = Math.round((doneSessions / totalSessions) * 100);
  const days = Array.from({ length: journey.cycleLength }, (_, i) => i + 1);

  return (
    <GradientBackground>
      <FlatList
        data={days}
        keyExtractor={(d) => String(d)}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>

            <View style={styles.titleArea}>
              <Text style={[styles.journeyName, { color: colors.foreground }]}>
                {journey.name}
              </Text>
              <Text style={[styles.dates, { color: colors.mutedForeground }]}>
                {startDate} – {endDate}
              </Text>
              {journey.intention ? (
                <Text
                  style={[styles.intention, { color: colors.mutedForeground }]}
                >
                  "{journey.intention}"
                </Text>
              ) : null}
            </View>

            <View style={styles.statsRow}>
              <StatBox label="Days Done" value={String(completedDays)} colors={colors} />
              <StatBox
                label="Sessions"
                value={`${doneSessions}/${totalSessions}`}
                colors={colors}
              />
              <StatBox label="Complete" value={`${pct}%`} colors={colors} />
            </View>

            {!isPremium && (
              <View
                style={[
                  styles.archiveBanner,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Feather name="lock" size={13} color={colors.mutedForeground} />
                <Text
                  style={[styles.archiveBannerText, { color: colors.mutedForeground }]}
                >
                  Unlock Archive to read every affirmation you've written
                </Text>
                <Pressable onPress={unlockPremium} hitSlop={8}>
                  <Text style={[styles.archiveBannerCta, { color: colors.primary }]}>
                    Unlock
                  </Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              DAY BY DAY
            </Text>
          </View>
        }
        renderItem={({ item: dayNum }) => {
          const day = journey.progress[dayNum];
          const m = day?.completionStatus.morning ?? false;
          const a = day?.completionStatus.afternoon ?? false;
          const e = day?.completionStatus.evening ?? false;
          const allDone = m && a && e;
          const hasAny = m || a || e;

          const rowContent = (
            <View
              style={[
                styles.dayRow,
                {
                  backgroundColor: allDone ? colors.secondary : colors.card,
                  borderColor: allDone ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.dayNumArea}>
                <Text style={[styles.dayNum, { color: colors.mutedForeground }]}>
                  {dayNum}
                </Text>
              </View>
              <SessionDot done={m} label="3" color={colors.morning} colors={colors} />
              <SessionDot done={a} label="6" color={colors.afternoon} colors={colors} />
              <SessionDot done={e} label="9" color={colors.evening} colors={colors} />
              {isPremium ? (
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.mutedForeground}
                  style={styles.rowEnd}
                />
              ) : hasAny ? (
                <Feather
                  name="lock"
                  size={15}
                  color={colors.mutedForeground}
                  style={styles.rowEnd}
                />
              ) : null}
            </View>
          );

          if (isPremium) {
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/day-affirmations",
                    params: { journeyId: journey.id, day: String(dayNum) },
                  })
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                {rowContent}
              </Pressable>
            );
          }
          return rowContent;
        }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />
    </GradientBackground>
  );
}

function StatBox({
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
      style={[
        styles.statBox,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function SessionDot({
  done,
  label,
  color,
  colors,
}: {
  done: boolean;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: done ? color + "33" : colors.secondary,
          borderColor: done ? color : colors.border,
        },
      ]}
    >
      <Text style={[styles.dotText, { color: done ? color : colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  backFallback: {
    padding: 12,
  },
  backFallbackText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 6,
  },
  listHeader: {
    gap: 16,
    marginBottom: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: {
    gap: 4,
  },
  journeyName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  dates: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  intention: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  archiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  archiveBannerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  archiveBannerCta: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayNumArea: {
    width: 28,
  },
  dayNum: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  rowEnd: {
    marginLeft: "auto",
  },
});
