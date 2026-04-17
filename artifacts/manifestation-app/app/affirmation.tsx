import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { ProgressBar } from "@/components/ProgressBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Session = "morning" | "afternoon" | "evening";

interface SessionInfo {
  count: number;
  label: string;
  style: string;
  description: string;
  guidance: string;
  example: string;
  placeholder: string;
  color: string;
}

const SESSION_INFO: Record<Session, SessionInfo> = {
  morning: {
    count: 3,
    label: "Morning",
    style: "Intention",
    description:
      "Morning is for planting the seed. Write with openness and trust — ground yourself in what you are calling in.",
    guidance:
      "Keep it present tense and open. Begin with gratitude. \"I am grateful for and open to...\"",
    example:
      "I am grateful for and open to a life of deep peace, creative freedom and boundless joy.",
    placeholder: "Affirmation...",
    color: "#F9C74F",
  },
  afternoon: {
    count: 6,
    label: "Afternoon",
    style: "Amplification",
    description:
      "Afternoon is for amplification. Add feeling and detail — let your body sense the reality of what you are attracting.",
    guidance:
      "Add more texture and feeling. Begin with gratitude. \"I am grateful for attracting...\"",
    example:
      "I am grateful for attracting a clear, undeniable experience of abundance that I can feel, see and share.",
    placeholder: "Affirmation...",
    color: "#A78BFA",
  },
  evening: {
    count: 9,
    label: "Evening",
    style: "Embodiment",
    description:
      "Evening is the most powerful session. Write as though it has already happened — feel it fully as you put each word down.",
    guidance:
      "Write in the present tense as though it is already so. \"I am so grateful that I am now...\"",
    example:
      "I am so grateful that I am now experiencing a life of profound purpose, ease and connection to the universe.",
    placeholder: "Affirmation...",
    color: "#7B61FF",
  },
};

const VALID_SESSIONS = new Set<Session>(["morning", "afternoon", "evening"]);

function isValidSession(s: string | undefined): s is Session {
  return typeof s === "string" && VALID_SESSIONS.has(s as Session);
}

export default function AffirmationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, viewOnly } = useLocalSearchParams<{
    session: string;
    viewOnly?: string;
  }>();
  const { saveAffirmations, settings, todayProgress, allProgress, currentDay } =
    useApp();

  const sessionKey: Session = isValidSession(session) ? session : "morning";
  const info = SESSION_INFO[sessionKey];
  const isViewOnly = viewOnly === "true";

  // ── Session window helpers (mirrors index.tsx logic) ─────────────────────
  function parseMinsA(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }
  function sessionExpiredA(s: "morning" | "afternoon"): boolean {
    if (!settings) return false;
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const t = settings.notificationTimes;
    if (s === "morning") return now >= parseMinsA(t.afternoon);
    return now >= parseMinsA(t.evening);
  }

  const guardChecked = useRef(false);
  useEffect(() => {
    if (isViewOnly || guardChecked.current) return;
    if (!isValidSession(session)) {
      router.replace("/(tabs)");
      return;
    }
    const status = todayProgress?.completionStatus;
    if (!status) return; // not loaded yet — wait for next update
    if (!settings) return;
    guardChecked.current = true;
    // Already complete — redirect to view mode instead
    if (status[sessionKey]) {
      router.replace("/(tabs)");
      return;
    }
    // Afternoon is only blocked if morning is still in its window (not expired) and incomplete
    if (sessionKey === "afternoon" && !status.morning && !sessionExpiredA("morning")) {
      router.replace("/(tabs)");
      return;
    }
    // Evening is blocked if either afternoon (or morning, if afternoon also missed) are unresolved
    if (sessionKey === "evening") {
      const morningOk = status.morning || sessionExpiredA("morning");
      const afternoonOk = status.afternoon || sessionExpiredA("afternoon");
      if (!morningOk || !afternoonOk) {
        router.replace("/(tabs)");
        return;
      }
    }
  }, [session, sessionKey, todayProgress, isViewOnly, settings]);

  const storedAffirmations: string[] =
    isViewOnly && todayProgress?.sessions[sessionKey]
      ? todayProgress.sessions[sessionKey]
      : [];

  const [affirmations, setAffirmations] = useState<string[]>(
    isViewOnly
      ? storedAffirmations.length
        ? storedAffirmations
        : Array(info.count).fill("")
      : Array(info.count).fill("")
  );
  const [saving, setSaving] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const previousDaySession: string[] | null = (() => {
    if (currentDay <= 1) return null;
    const prev = allProgress[currentDay - 1];
    if (!prev) return null;
    const prevSess = prev.sessions[sessionKey];
    if (!prevSess || prevSess.length === 0) return null;
    return prevSess;
  })();

  const filledCount = affirmations.filter((a) => a.trim().length > 0).length;
  const allFilled = filledCount === info.count;

  function updateAffirmation(index: number, text: string) {
    const updated = [...affirmations];
    updated[index] = text;
    setAffirmations(updated);
  }

  async function handleSave() {
    if (!allFilled || saving) return;
    setSaving(true);
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await saveAffirmations(sessionKey, affirmations);
    router.replace({
      pathname: "/reflection",
      params: { session: sessionKey },
    });
  }

  return (
    <GradientBackground>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
          },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <View style={styles.labelRow}>
              <Text style={[styles.sessionLabel, { color: colors.mutedForeground }]}>
                {info.label.toUpperCase()} · {info.style.toUpperCase()}
              </Text>
              {isViewOnly && (
                <View
                  style={[
                    styles.viewOnlyBadge,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.viewOnlyText, { color: colors.mutedForeground }]}>
                    View only
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Affirmations
            </Text>
          </View>
        </View>

        {!isViewOnly && (
          <ProgressBar
            label=""
            current={filledCount}
            total={info.count}
            color={colors.primary}
          />
        )}

        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {info.description}
        </Text>

        <View
          style={[
            styles.guidanceCard,
            { backgroundColor: colors.primary + "11", borderColor: colors.primary + "44" },
          ]}
        >
          <Pressable
            onPress={() => setShowExample((v) => !v)}
            style={styles.tipToggleRow}
          >
            <Feather name="star" size={13} color={colors.primary} />
            <Text style={[styles.tipToggleLabel, { color: colors.primary }]}>
              Tip {"&"} Example
            </Text>
            <Feather
              name={showExample ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.primary}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
          {showExample && (
            <>
              <Text style={[styles.guidanceText, { color: colors.primary }]}>
                {info.guidance}
              </Text>
              <Text style={[styles.exampleText, { color: colors.primary + "CC" }]}>
                "{info.example}"
              </Text>
            </>
          )}
        </View>

        {previousDaySession && !isViewOnly && (
          <View
            style={[
              styles.prevCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.prevLabel, { color: colors.mutedForeground }]}>
              PREVIOUS {info.label.toUpperCase()} AFFIRMATION
            </Text>
            <Text style={[styles.prevText, { color: colors.foreground }]}>
              {previousDaySession[0]}
            </Text>
          </View>
        )}

        {settings?.intention ? (
          <View
            style={[
              styles.intentionHint,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.hintLabel, { color: colors.mutedForeground }]}>
              YOUR INTENTION
            </Text>
            <Text style={[styles.hintText, { color: colors.foreground }]}>
              {settings.intention}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputsContainer}>
          {affirmations.map((val, i) => (
            <View key={i} style={styles.inputRow}>
              <View
                style={[
                  styles.inputNumber,
                  {
                    backgroundColor:
                      val.trim().length > 0 ? colors.primary : colors.card,
                    borderColor:
                      val.trim().length > 0 ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.inputNumberText,
                    {
                      color:
                        val.trim().length > 0
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              {isViewOnly ? (
                <View
                  style={[
                    styles.viewOnlyInput,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewOnlyInputText,
                      {
                        color: val.trim()
                          ? colors.foreground
                          : colors.mutedForeground,
                        fontStyle: val.trim() ? "italic" : "normal",
                      },
                    ]}
                  >
                    {val.trim() || "Not written"}
                  </Text>
                </View>
              ) : (
                <TextInput
                  ref={(r) => {
                    inputs.current[i] = r;
                  }}
                  value={val}
                  onChangeText={(t) => updateAffirmation(i, t)}
                  placeholder={info.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType={i < info.count - 1 ? "next" : "done"}
                  onSubmitEditing={() => {
                    if (i < info.count - 1) {
                      inputs.current[i + 1]?.focus();
                    }
                  }}
                  contextMenuHidden={i > 0}
                  style={[
                    styles.textInput,
                    {
                      color: colors.foreground,
                      borderColor:
                        val.trim().length > 0 ? colors.primary : colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {!isViewOnly && (
          <Pressable
            onPress={handleSave}
            disabled={!allFilled || saving}
            style={[
              styles.saveBtn,
              {
                backgroundColor: allFilled ? colors.primary : colors.secondary,
                opacity: allFilled ? 1 : 0.5,
              },
            ]}
          >
            <Text
              style={[
                styles.saveBtnText,
                {
                  color: allFilled ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {saving
                ? "Saving..."
                : allFilled
                ? "Complete Session"
                : `${filledCount}/${info.count} filled`}
            </Text>
            {allFilled && !saving && (
              <Feather name="check" size={18} color={colors.primaryForeground} />
            )}
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  headerRow: {
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
  headerTextContainer: {
    gap: 2,
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sessionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  styleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  styleBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  viewOnlyBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewOnlyText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  heading: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    marginTop: -8,
  },
  guidanceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  tipToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  tipToggleLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  guidanceText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  exampleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  prevCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  prevLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  prevText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  intentionHint: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  hintLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  hintText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  inputsContainer: {
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputNumberText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  viewOnlyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  viewOnlyInputText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
