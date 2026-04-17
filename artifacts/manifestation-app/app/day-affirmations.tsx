import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

type SessionKey = "morning" | "afternoon" | "evening";

const SESSION_META: Record<SessionKey, { label: string; badge: string }> = {
  morning: { label: "Morning", badge: "3×" },
  afternoon: { label: "Afternoon", badge: "6×" },
  evening: { label: "Evening", badge: "9×" },
};

export default function DayAffirmationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { journeyId, day } = useLocalSearchParams<{
    journeyId: string;
    day: string;
  }>();
  const { allProgress, archivedJourneys, settings, isPremium } = useApp();

  const dayNum = parseInt(day ?? "1", 10);

  let dayProgress = allProgress[dayNum] ?? null;
  let journeyName = settings?.journeyName || "Current Journey";

  if (journeyId !== "current") {
    const journey = archivedJourneys.find((j) => j.id === journeyId);
    dayProgress = journey?.progress[dayNum] ?? null;
    journeyName = journey?.name || "Journey";
  }

  if (!isPremium) {
    return (
      <GradientBackground>
        <View style={styles.premiumGate}>
          <Feather name="lock" size={32} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>
            Premium Feature
          </Text>
          <Text style={[styles.gateBody, { color: colors.mutedForeground }]}>
            Unlock Premium to read your past affirmations.
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.gateBack, { color: colors.primary }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  const sessions = dayProgress?.sessions;
  const hasAnySession =
    sessions &&
    ((sessions.morning?.length ?? 0) > 0 ||
      (sessions.afternoon?.length ?? 0) > 0 ||
      (sessions.evening?.length ?? 0) > 0);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 80 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 60 : 48),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>
              Day {dayNum}
            </Text>
            <Text style={[styles.journeyName, { color: colors.mutedForeground }]}>
              {journeyName}
            </Text>
          </View>
        </View>

        {!hasAnySession ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>
              ◎
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No affirmations recorded
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              No sessions were completed for this day.
            </Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {(["morning", "afternoon", "evening"] as SessionKey[]).map((sk) => {
              const meta = SESSION_META[sk];
              const sessionColor = colors[sk];
              const completed = dayProgress?.completionStatus[sk] ?? false;
              const affirmations = sessions?.[sk] ?? [];

              return (
                <View
                  key={sk}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: completed
                        ? sessionColor + "55"
                        : colors.border,
                    },
                  ]}
                >
                  <View style={styles.sessionHeader}>
                    <View
                      style={[
                        styles.sessionDot,
                        {
                          backgroundColor: sessionColor + "22",
                          borderColor: sessionColor + "66",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.sessionDotCore,
                          { backgroundColor: sessionColor },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.sessionLabel, { color: sessionColor }]}
                    >
                      {meta.label}
                    </Text>
                    <View
                      style={[
                        styles.sessionBadge,
                        {
                          backgroundColor: sessionColor + "22",
                          borderColor: sessionColor + "44",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionBadgeText,
                          { color: sessionColor },
                        ]}
                      >
                        {meta.badge}
                      </Text>
                    </View>
                    <Feather
                      name={completed ? "check-circle" : "circle"}
                      size={16}
                      color={completed ? sessionColor : colors.border}
                      style={styles.sessionCheck}
                    />
                  </View>

                  {completed && affirmations.length > 0 ? (
                    <View
                      style={[
                        styles.affirmationsList,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      {affirmations.map((text, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.affirmationRow,
                            idx < affirmations.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.affirmationNum,
                              { borderColor: sessionColor + "55" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.affirmationNumText,
                                { color: sessionColor },
                              ]}
                            >
                              {idx + 1}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.affirmationText,
                              { color: colors.foreground },
                            ]}
                          >
                            {text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : !completed ? (
                    <View style={styles.notCompleted}>
                      <Text
                        style={[
                          styles.notCompletedText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Session not completed
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  premiumGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  gateTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  gateBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  gateBack: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  dayTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  journeyName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  sessionsList: {
    gap: 16,
  },
  sessionCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  sessionDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionDotCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  sessionBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  sessionCheck: {
    marginLeft: 4,
  },
  affirmationsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  affirmationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  affirmationNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  affirmationNumText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  affirmationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 22,
  },
  notCompleted: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  notCompletedText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});
