import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { TimePicker } from "@/components/TimePicker";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { UserSettings } from "@/utils/storage";
import { validateNotificationTimes } from "@/utils/notifications";

const STEPS = ["welcome", "cycle", "intention", "notifications"] as const;
type Step = (typeof STEPS)[number];

function TimeInput({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.timeInputRow}>
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TimePicker value={value} onChange={onChange} />
    </View>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, startNewJourney, manifestItems } = useApp();
  const { newJourney } = useLocalSearchParams<{ newJourney?: string }>();
  const isNewJourney = newJourney === "true";

  const [step, setStep] = useState<Step>(isNewJourney ? "cycle" : "welcome");
  const [cycleLength, setCycleLength] = useState<33 | 45>(33);
  const [intention, setIntention] = useState("");
  const [morningTime, setMorningTime] = useState("08:00");
  const [afternoonTime, setAfternoonTime] = useState("13:00");
  const [eveningTime, setEveningTime] = useState("21:00");
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  async function handleComplete() {
    const times = { morning: morningTime, afternoon: afternoonTime, evening: eveningTime };
    const errors = validateNotificationTimes(times);
    if (errors.length > 0) {
      setTimeError(errors.join(" "));
      return;
    }
    setTimeError(null);
    setLoading(true);
    const settings: UserSettings = {
      cycleLength,
      startDate: new Date().toISOString(),
      intention,
      notificationTimes: times,
    };
    if (isNewJourney) {
      await startNewJourney(settings);
      router.replace("/(tabs)/journeys");
    } else {
      await completeOnboarding(settings);
      router.replace("/");
    }
  }

  function next() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) {
      setStep(STEPS[i + 1]);
    } else {
      handleComplete();
    }
  }

  function back() {
    const i = STEPS.indexOf(step);
    const firstStep = isNewJourney ? "cycle" : "welcome";
    if (step === firstStep) {
      router.back();
    } else if (i > 0) {
      setStep(STEPS[i - 1]);
    }
  }

  const isLast = step === "notifications";

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i <= stepIndex ? colors.primary : colors.border,
                    width: i === stepIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {step === "welcome" && (
            <View style={styles.stepContent}>
              <View
                style={[styles.iconCircle, { borderColor: colors.primary }]}
              >
                <Text style={styles.iconEmoji}>✦</Text>
              </View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                3 · 6 · 9
              </Text>
              <Text
                style={[styles.subheading, { color: colors.mutedForeground }]}
              >
                Manifestation Companion
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                Harness Nikola Tesla's method. Write your intention 3 times in
                the morning, 6 in the afternoon, and 9 in the evening — every
                day.
              </Text>
            </View>
          )}

          {step === "cycle" && (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Choose your cycle
              </Text>
              <Text
                style={[styles.body, { color: colors.mutedForeground }]}
              >
                How many days will your journey last?
              </Text>
              <View style={styles.cycleOptions}>
                {([33, 45] as const).map((len) => (
                  <Pressable
                    key={len}
                    onPress={() => setCycleLength(len)}
                    style={[
                      styles.cycleOption,
                      {
                        borderColor:
                          cycleLength === len ? colors.primary : colors.border,
                        backgroundColor:
                          cycleLength === len ? colors.secondary : colors.card,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cycleNumber,
                        {
                          color:
                            cycleLength === len
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {len}
                    </Text>
                    <Text
                      style={[
                        styles.cycleDays,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      days
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === "intention" && (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Your intention
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                What do you want to manifest? This is optional — but writing it
                down anchors your practice.
              </Text>

              {manifestItems.filter((i) => !i.manifested).length > 0 && (
                <View style={styles.pickSection}>
                  <Text style={[styles.pickLabel, { color: colors.mutedForeground }]}>
                    PICK FROM YOUR LIST
                  </Text>
                  <View style={styles.pickList}>
                    {Array.from(
                      new Map(
                        manifestItems
                          .filter((i) => !i.manifested)
                          .map((i) => [i.text.trim().toLowerCase(), i])
                      ).values()
                    )
                      .map((item) => {
                        const selected = intention.trim() === item.text.trim();
                        return (
                          <Pressable
                            key={item.id}
                            onPress={() =>
                              setIntention(selected ? "" : item.text)
                            }
                            style={[
                              styles.pickItem,
                              {
                                borderColor: selected
                                  ? colors.primary
                                  : colors.border,
                                backgroundColor: selected
                                  ? colors.primary + "18"
                                  : colors.card,
                              },
                            ]}
                          >
                            <Feather
                              name={selected ? "check-circle" : "circle"}
                              size={16}
                              color={selected ? colors.primary : colors.mutedForeground}
                            />
                            <Text
                              style={[
                                styles.pickItemText,
                                {
                                  color: selected
                                    ? colors.foreground
                                    : colors.mutedForeground,
                                  flex: 1,
                                },
                              ]}
                            >
                              {item.text}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </View>
                  <Text style={[styles.orLabel, { color: colors.mutedForeground }]}>
                    — or write your own —
                  </Text>
                </View>
              )}

              <TextInput
                value={intention}
                onChangeText={setIntention}
                placeholder="I'd like to manifest..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                style={[
                  styles.intentionInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />
            </View>
          )}

          {step === "notifications" && (
            <View style={styles.stepContent}>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Set your reminders
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                These times set when each session window opens — and when you'll receive a reminder. Morning closes when afternoon begins, and afternoon closes when evening begins.
              </Text>
              <View
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TimeInput
                  label="Morning"
                  value={morningTime}
                  onChange={setMorningTime}
                  colors={colors}
                />
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <TimeInput
                  label="Afternoon"
                  value={afternoonTime}
                  onChange={setAfternoonTime}
                  colors={colors}
                />
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <TimeInput
                  label="Evening"
                  value={eveningTime}
                  onChange={setEveningTime}
                  colors={colors}
                />
              </View>
              {timeError ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {timeError}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.actions}>
            {stepIndex > 0 && (
              <Pressable
                onPress={back}
                style={[styles.backBtn, { borderColor: colors.border }]}
              >
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
            )}
            <Pressable
              onPress={next}
              disabled={loading}
              style={[
                styles.nextBtn,
                { backgroundColor: colors.primary, flex: stepIndex > 0 ? 1 : undefined },
              ]}
            >
              <Text
                style={[styles.nextBtnText, { color: colors.primaryForeground }]}
              >
                {isLast ? (loading ? "Starting..." : "Begin journey") : "Continue"}
              </Text>
              {!isLast && (
                <Feather
                  name="arrow-right"
                  size={18}
                  color={colors.primaryForeground}
                />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 32,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    gap: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 32,
    color: "#A78BFA",
  },
  heading: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 40,
  },
  subheading: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: -12,
  },
  body: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
  cycleOptions: {
    flexDirection: "row",
    gap: 16,
  },
  cycleOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    gap: 4,
  },
  cycleNumber: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
  },
  cycleDays: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  pickSection: {
    gap: 10,
  },
  pickLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  pickList: {
    gap: 8,
  },
  pickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickItemText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  orLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 4,
  },
  intentionInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    minWidth: 80,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
