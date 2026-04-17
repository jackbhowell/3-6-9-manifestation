import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

interface DayItemProps {
  dayNumber: number;
  currentDay: number;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  isFuture: boolean;
  isPremium: boolean;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
}

function DayItem({
  dayNumber,
  currentDay,
  morning,
  afternoon,
  evening,
  isFuture,
  isPremium,
  onPress,
  colors,
}: DayItemProps) {
  const isToday = dayNumber === currentDay;
  const allDone = morning && afternoon && evening;
  const hasAny = morning || afternoon || evening;
  const isTappable = isPremium && !isFuture;

  const card = (
    <View
      style={[
        styles.dayCard,
        {
          backgroundColor: isToday ? colors.secondary : colors.card,
          borderColor: isToday
            ? colors.primary
            : allDone
            ? colors.accent
            : colors.border,
          opacity: isFuture ? 0.4 : 1,
        },
      ]}
    >
      <View style={styles.dayNumber}>
        <Text
          style={[
            styles.dayNum,
            { color: isToday ? colors.primary : colors.mutedForeground },
          ]}
        >
          {dayNumber}
        </Text>
      </View>

      <View style={styles.dayContent}>
        <Text style={[styles.dayLabel, { color: colors.foreground }]}>
          Day {dayNumber}
          {isToday ? "  (Today)" : ""}
        </Text>
        <View style={styles.sessionsRow}>
          <SessionDot completed={morning} color={colors.morning} label="M" colors={colors} />
          <SessionDot completed={afternoon} color={colors.afternoon} label="A" colors={colors} />
          <SessionDot completed={evening} color={colors.evening} label="E" colors={colors} />
        </View>
      </View>

      {isTappable ? (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      ) : !isPremium && hasAny && !isFuture ? (
        <Feather name="lock" size={15} color={colors.mutedForeground} />
      ) : allDone ? (
        <Feather name="check-circle" size={18} color={colors.success} />
      ) : hasAny && !isFuture ? (
        <View style={[styles.partialBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.partialText, { color: colors.mutedForeground }]}>
            {[morning, afternoon, evening].filter(Boolean).length}/3
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (isTappable) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {card}
      </Pressable>
    );
  }
  return card;
}

function SessionDot({
  completed,
  color,
  label,
  colors,
}: {
  completed: boolean;
  color: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: completed ? color : colors.border },
      ]}
    >
      <Text
        style={[
          styles.dotLabel,
          { color: completed ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, currentDay, allProgress, isPremium, unlockPremium } = useApp();

  if (!settings) {
    return (
      <GradientBackground>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No progress yet
          </Text>
        </View>
      </GradientBackground>
    );
  }

  const totalDays = settings.cycleLength;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const totalCompleted = days.filter((d) => {
    const p = allProgress[d];
    return (
      p?.completionStatus.morning &&
      p?.completionStatus.afternoon &&
      p?.completionStatus.evening
    );
  }).length;

  const overallPct = Math.round((totalCompleted / totalDays) * 100);

  return (
    <GradientBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
        ]}
      >
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Progress
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {totalCompleted}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Complete
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {overallPct}%
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Journey
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {currentDay}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Current day
            </Text>
          </View>
        </View>

        {!isPremium && (
          <View style={[styles.archiveBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="lock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.archiveBannerText, { color: colors.mutedForeground }]}>
              Unlock Archive to read every affirmation you've written
            </Text>
            <Pressable onPress={unlockPremium} hitSlop={8}>
              <Text style={[styles.archiveBannerCta, { color: colors.primary }]}>
                Unlock
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.legend}>
          <LegendItem color={colors.morning} label="Morning" colors={colors} />
          <LegendItem color={colors.afternoon} label="Afternoon" colors={colors} />
          <LegendItem color={colors.evening} label="Evening" colors={colors} />
        </View>

        <FlatList
          data={days}
          keyExtractor={(d) => d.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={days.length > 0}
          renderItem={({ item: day }) => {
            const p = allProgress[day];
            return (
              <DayItem
                dayNumber={day}
                currentDay={currentDay}
                morning={p?.completionStatus.morning ?? false}
                afternoon={p?.completionStatus.afternoon ?? false}
                evening={p?.completionStatus.evening ?? false}
                isFuture={day > currentDay}
                isPremium={isPremium}
                onPress={() =>
                  router.push({
                    pathname: "/day-affirmations",
                    params: { journeyId: "current", day: String(day) },
                  })
                }
                colors={colors}
              />
            );
          }}
        />
      </View>
    </GradientBackground>
  );
}

function LegendItem({
  color,
  label,
  colors,
}: {
  color: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  archiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
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
  legend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayNumber: {
    width: 32,
    alignItems: "center",
  },
  dayNum: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  dayContent: {
    flex: 1,
    gap: 6,
  },
  dayLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  sessionsRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  partialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  partialText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
