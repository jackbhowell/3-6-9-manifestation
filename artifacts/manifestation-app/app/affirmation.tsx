import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientBackground } from "@/components/GradientBackground";
import { ProgressBar } from "@/components/ProgressBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Session = "morning" | "afternoon" | "evening";

const SESSION_INFO: Record<
  Session,
  { count: number; label: string; description: string; color: string }
> = {
  morning: {
    count: 3,
    label: "Morning",
    description: "Write your intention 3 times with full focus.",
    color: "#F9C74F",
  },
  afternoon: {
    count: 6,
    label: "Afternoon",
    description: "Deepen the signal — 6 repetitions build resonance.",
    color: "#A78BFA",
  },
  evening: {
    count: 9,
    label: "Evening",
    description: "9 is the completion number. Feel it as you write.",
    color: "#7B61FF",
  },
};

export default function AffirmationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useLocalSearchParams<{ session: string }>();
  const { saveAffirmations, settings } = useApp();

  const sessionKey = (session as Session) ?? "morning";
  const info = SESSION_INFO[sessionKey];

  const [affirmations, setAffirmations] = useState<string[]>(
    Array(info.count).fill("")
  );
  const [saving, setSaving] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

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
            <Text style={[styles.sessionLabel, { color: info.color }]}>
              {info.label.toUpperCase()}
            </Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Affirmations
            </Text>
          </View>
        </View>

        <ProgressBar
          label=""
          current={filledCount}
          total={info.count}
          color={info.color}
        />

        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {info.description}
        </Text>

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
                      val.trim().length > 0 ? info.color : colors.card,
                    borderColor:
                      val.trim().length > 0 ? info.color : colors.border,
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
              <TextInput
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                value={val}
                onChangeText={(t) => updateAffirmation(i, t)}
                placeholder={`Write your intention...`}
                placeholderTextColor={colors.mutedForeground}
                returnKeyType={i < info.count - 1 ? "next" : "done"}
                onSubmitEditing={() => {
                  if (i < info.count - 1) {
                    inputs.current[i + 1]?.focus();
                  }
                }}
                style={[
                  styles.textInput,
                  {
                    color: colors.foreground,
                    borderColor:
                      val.trim().length > 0 ? info.color : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!allFilled || saving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: allFilled ? info.color : colors.secondary,
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
  },
  sessionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
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
